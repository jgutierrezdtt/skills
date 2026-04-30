## Use Case: Executive Summary

This reference covers assembling a management-level security posture summary from Fortify data. An executive summary should be concise, risk-oriented, and actionable — not a raw issue dump.

---

### Inputs to Collect Before Generating

Before running any queries, confirm with the user:
- Scope: single application, a set of applications, or full portfolio
- Platform: FoD or SSC
- Audience: engineering leadership, CISO, board-level (affects detail level)
- Time frame for trend comparison (if any)

---

### Core Metrics to Include

A complete executive summary includes the following data points:

1. **Open critical and high issue count** — unresolved, not suppressed, not FP
2. **Policy pass/fail status** — does the application currently meet the security policy gate
3. **Issues introduced in the last 30 days** — regression indicator
4. **Issues resolved in the last 30 days** — remediation velocity
5. **Risk-accepted issue count** — governance exposure
6. **Scan coverage** — last scan date; flag applications not scanned in 90+ days

---

### FoD Queries

**Open critical/high issues (not suppressed, not FP):**
```bash
fcli fod issue list \
  --rel "<AppName>:<ReleaseName>" \
  --query "severity in ('Critical','High') && reviewStatus!='Suppressed' && reviewStatus!='False Positive'" \
  -o json
```

**Policy status:**
```bash
fcli fod release list \
  --query "applicationName=='<AppName>'" \
  --include-fields releaseId,releaseName,isPassed,issueCount,criticalIssueCount,highIssueCount \
  -o table
```

**Releases not scanned in 90 days:**
```bash
fcli fod release list \
  --query "isPassed!=null && (lastScanDate==null || lastScanDate<'<DateMinus90Days>')" \
  -o json
```

**Risk-accepted issues:**
```bash
fcli fod issue list \
  --rel "<AppName>:<ReleaseName>" \
  --query "reviewStatus=='Risk Accepted'" \
  -o json
```

---

### SSC Queries

**Open critical/high issues:**
```bash
fcli ssc issue list \
  --av "<AppName>:<VersionName>" \
  --query "friority in ('Critical','High') && analysisValue!='Suppressed' && analysisValue!='False Positive'" \
  -o json
```

**Policy and attention status:**
```bash
fcli ssc appversion list \
  --query "project.name=='<AppName>'" \
  --include-fields id,name,project.name,currentState.analysisResultsExist,currentState.attentionRequired \
  -o table
```

**Versions not scanned in 90 days:**
```bash
fcli ssc appversion list \
  --query "currentState.analysisResultsExist==true" \
  --include-fields project.name,name,currentState.lastFprUploadDate \
  -o json
```

---

### Structuring the Summary Output

When presenting the summary to the user, organize it as:

1. **Overall Risk Status** — High / Medium / Low or RAG (Red/Amber/Green) based on policy pass/fail and critical count
2. **Key Metrics Table** — Critical open, High open, Risk Accepted, Scan Coverage
3. **Top 3 Applications by Risk** — sorted by critical count descending
4. **Trend vs. Previous Period** — issues introduced vs. resolved
5. **Immediate Actions Required** — applications failing policy, applications without scan coverage

Do not output a raw JSON array as the executive summary. Transform the data into a structured narrative or table format appropriate for the stated audience.
