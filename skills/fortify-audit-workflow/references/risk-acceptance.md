## Use Case: Risk Acceptance

Risk acceptance is a formal, documented decision that a known vulnerability will not be fixed in the current cycle and the associated business risk is explicitly acknowledged. It differs from suppression in that the finding remains visible in reports and continues to count against policy metrics unless the policy is specifically configured to exclude it.

---

### When to Use Risk Acceptance

Risk acceptance is appropriate when:
- The issue is real and confirmed (not a false positive).
- A fix is technically feasible but deferred by a deliberate business decision.
- The decision has been reviewed and approved by a named stakeholder.

Do not accept risk as a shortcut to clear findings without analysis. Always require a justification comment and, for high or critical severity, prompt the user to name the approver.

---

### Risk Acceptance Workflow

**Step 1: Identify the issue**

Retrieve the issue details before updating:

**FoD:**
```bash
fcli fod issue get --rel "<AppName>:<ReleaseName>" --id <instanceId> -o json
```

**SSC:**
```bash
fcli ssc issue get --av "<AppName>:<VersionName>" --id <issueInstanceId> -o json
```

**Step 2: Confirm the decision with the user**

Before executing, confirm:
- The exact issue (show `instanceId`, `category`, `severity`, `primaryLocation`)
- The business justification (required as `--comment`)
- The approver name for High or Critical severity findings

**Step 3: Apply risk acceptance**

**FoD:**
```bash
fcli fod issue update \
  --rel "<AppName>:<ReleaseName>" \
  --id <instanceId> \
  --analysis "Risk Accepted" \
  --comment "<Justification: business reason and approver name>"
```

**SSC:**
```bash
fcli ssc issue update \
  --av "<AppName>:<VersionName>" \
  --id <issueInstanceId> \
  --analysis "Risk Accepted" \
  --comment "<Justification: business reason and approver name>"
```

---

### Tracking Open Risk Acceptances

**FoD — list all risk-accepted issues:**
```bash
fcli fod issue list \
  --rel "<AppName>:<ReleaseName>" \
  --query "reviewStatus=='Risk Accepted'" \
  -o json
```

**SSC — list all risk-accepted issues:**
```bash
fcli ssc issue list \
  --av "<AppName>:<VersionName>" \
  --query "analysisValue=='Risk Accepted'" \
  -o json
```

To surface the count across all versions (portfolio risk dashboard):
```bash
fcli ssc issue list \
  --av "<AppName>:<VersionName>" \
  --query "analysisValue=='Risk Accepted' && friority=='Critical'" \
  -o json
```

---

### Risk Acceptance Expiry and Review

Risk acceptance decisions should have a defined expiry horizon. In the absence of a platform-enforced expiry, track the acceptance date via the `--comment` field (include the decision date and an agreed-upon review date).

To find risk-accepted issues that may be stale:
```bash
fcli ssc issue list \
  --av "<AppName>:<VersionName>" \
  --query "analysisValue=='Risk Accepted' && foundDate<'<CutoffDate>'" \
  -o json
```

Prompt the user for the cutoff date (ISO 8601) before running this query.

---

### Escalation Criteria

Surface these issues to the user for escalation to a security review board:

- Critical severity issues where risk acceptance is requested without a named approver
- Risk-accepted issues that have been open for more than 12 months
- More than 10 risk-accepted Critical issues in a single application version

---

### Risk Acceptance vs. Other Audit States

| State | Meaning | Counts against policy |
|-------|---------|----------------------|
| `Risk Accepted` | Acknowledged, no fix planned | Yes (unless policy excludes it) |
| `Suppressed` | Excluded from current scope | No |
| `False Positive` | Analyzer is wrong | No |

When the user asks which to use: risk acceptance is for real vulnerabilities with a deliberate deferral decision. Suppression is for findings that are valid but not relevant to the current scan scope (e.g., third-party code, test utilities).
