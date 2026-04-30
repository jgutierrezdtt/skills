## Use Case: False Positive Management

A false positive is a finding where the reported vulnerability does not represent a real security risk in the given context — the code path is unreachable, the input is fully trusted, or the analysis is structurally incorrect for this codebase.

Marking an issue as `False Positive` is a developer-owned decision. The auditor must provide evidence or rationale. This reference covers how to identify, document, and track false positives in both FoD and SSC.

---

### Identifying Candidates for False Positive Classification

Before marking anything, confirm that the issue is genuinely not exploitable. Useful signals:

- The flagged input is sourced from a trusted, internal-only system (not user-controlled).
- The flagged code path is dead code or protected by a guard that Fortify's static analysis did not model.
- The same finding has been consistently marked FP across multiple scan cycles by multiple reviewers.

Do not mark as false positive based solely on "we have a validator somewhere" — verify that the validator covers the exact flagged flow.

---

### Marking a Single Issue as False Positive

**FoD — update a single issue:**
```bash
fcli fod issue update \
  --rel "<AppName>:<ReleaseName>" \
  --id <instanceId> \
  --analysis "False Positive" \
  --comment "<Evidence: why this is not exploitable>"
```

**SSC — update a single issue:**
```bash
fcli ssc issue update \
  --av "<AppName>:<VersionName>" \
  --id <issueInstanceId> \
  --analysis "False Positive" \
  --comment "<Evidence: why this is not exploitable>"
```

The `--comment` field is mandatory for false positive decisions. If the user has not provided a rationale, prompt them before executing.

---

### Reviewing Existing False Positives

**FoD — list all issues currently marked as false positive:**
```bash
fcli fod issue list \
  --rel "<AppName>:<ReleaseName>" \
  --query "reviewStatus=='False Positive'" \
  -o json
```

**SSC — list all issues currently marked as false positive:**
```bash
fcli ssc issue list \
  --av "<AppName>:<VersionName>" \
  --query "analysisValue=='False Positive'" \
  -o json
```

Surface this list to the user when they want to audit their FP decisions — for example, during a security review or before a compliance assessment.

---

### False Positive Aging

A false positive decision should be periodically re-evaluated. Issues marked as FP more than 180 days ago are candidates for review:

**SSC:**
```bash
fcli ssc issue list \
  --av "<AppName>:<VersionName>" \
  --query "analysisValue=='False Positive' && foundDate<'<DateMinus180Days>'" \
  -o json
```

Prompt the user to provide the cutoff date (ISO 8601 format: `2024-08-01`) before running this query.

---

### Re-opening a False Positive

If a false positive decision needs to be reversed (e.g., the code changed and the issue is now exploitable):

**FoD:**
```bash
fcli fod issue update \
  --rel "<AppName>:<ReleaseName>" \
  --id <instanceId> \
  --analysis "Not Reviewed" \
  --comment "<Reason for reverting the FP decision>"
```

**SSC:**
```bash
fcli ssc issue update \
  --av "<AppName>:<VersionName>" \
  --id <issueInstanceId> \
  --analysis "Not Reviewed" \
  --comment "<Reason for reverting the FP decision>"
```

---

### Bulk False Positive Operations

If the user wants to mark many issues as false positive at once, load `references/bulk-triage.md` and apply the guardrails defined there (show list first, confirm if more than 50 issues).

---

### False Positive vs. Suppressed

| Decision | Meaning | Use when |
|----------|---------|----------|
| `False Positive` | Static analysis is wrong; issue does not exist | The vulnerability model does not apply to this code |
| `Suppressed` | Issue may be valid but is intentionally excluded | The issue is acknowledged but out of scope for this version/context |

When the user is unsure which to use, ask: "Is the analyzer wrong (False Positive) or is the issue real but not applicable here (Suppressed)?"
