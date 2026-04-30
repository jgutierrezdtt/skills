## Use Case: Trend Analysis

Trend analysis answers the question: "Is our security posture improving or degrading over time?" This requires comparing metrics across multiple scan cycles, release versions, or calendar periods.

---

### Inputs to Collect

Before running trend queries, confirm:
- Which application and release/version to analyze
- The comparison baseline: specific version name, specific date range, or number of recent scans
- Which metric to trend: total issues, critical/high count, new issues introduced, remediation velocity, or policy pass rate

---

### Comparing Two Scan Cycles (SSC)

SSC artifact history provides scan-by-scan data:

**List recent artifacts (uploads) with timestamps:**
```bash
fcli ssc artifact list \
  --av "<AppName>:<VersionName>" \
  --query "type=='SCA'" \
  -o json
```

Use the artifact upload dates as the comparison boundaries. Then compare issue counts at each point:

**Issue count at current state:**
```bash
fcli ssc issue count --av "<AppName>:<VersionName>"
```

**Issue count filtered by discovery date (new issues since a specific date):**
```bash
fcli ssc issue list \
  --av "<AppName>:<VersionName>" \
  --query "foundDate>='<StartDate>' && friority in ('Critical','High')" \
  -o json
```

**Issues removed (fixed) since a specific date:**

SSC does not directly expose "fixed date" via fcli. Use `removedDate` if available in the API response, or compare counts across artifact upload timestamps using stored results.

---

### Regression Detection

A regression is when new Critical or High issues appear after a previously clean or improving cycle.

**FoD — issues introduced since last release:**
```bash
fcli fod issue list \
  --rel "<AppName>:<ReleaseName>" \
  --query "foundDate>='<LastScanDate>' && severity in ('Critical','High')" \
  -o json
```

**SSC — critical issues with `delta` signal:**
```bash
fcli ssc appversion list \
  --query "project.name=='<AppName>'" \
  --include-fields project.name,name,currentState.criticalPriorityIssueCountDelta \
  -o json
```

A positive `criticalPriorityIssueCountDelta` means new critical issues were introduced in the most recent scan. Surface this immediately as a regression signal.

---

### Tracking Remediation Velocity

Remediation velocity measures how fast the team is resolving findings.

**FoD — resolved issues in a date window:**
```bash
fcli fod issue list \
  --rel "<AppName>:<ReleaseName>" \
  --query "reviewStatus=='Not an Issue' && lastUpdateDate>='<StartDate>'" \
  -o json
```

**SSC — issues with analysis set to fixed/resolved within a period:**
```bash
fcli ssc issue list \
  --av "<AppName>:<VersionName>" \
  --query "analysisValue=='Reliability Issue' && lastUpdateDate>='<StartDate>'" \
  -o json
```

To calculate velocity: count resolved issues divided by number of days in the period. Compare velocity across periods to determine if the team is accelerating or slowing down.

---

### Multi-Version Trend (SSC Portfolio)

To compare posture across multiple versions of the same application (e.g., v24.1, v24.2, v25.1):

```bash
fcli ssc appversion list \
  --query "project.name=='<AppName>'" \
  --include-fields id,name,project.name,currentState.criticalIssueCount,currentState.highIssueCount \
  -o json
```

Sort the output by version name or by `id` (lower ID = older version) to construct a chronological trend.

---

### Multi-Application Trend (FoD Portfolio)

To compare Critical issue counts across all releases flagged as Production:

```bash
fcli fod release list \
  --query "sdlcStatusType=='Production'" \
  --include-fields releaseId,applicationName,releaseName,criticalIssueCount,highIssueCount,lastScanDate \
  -o json
```

Sort by `criticalIssueCount` descending to identify which applications are trending worse.

---

### Presenting Trend Data

When presenting trend results:
- Use a table with columns: Period, Critical, High, Medium, Low, New, Resolved
- Calculate and show the delta between periods explicitly (not just the raw counts)
- Flag any period where Critical count increased as a regression
- Highlight the remediation velocity (resolved/week) if the user is tracking sprint-level progress
