## Use Case: Bulk Triage

This reference covers querying, filtering, and updating issue audit state for multiple findings at once.

---

### Step 1: Query Issues Before Any Write Operation

Always list the issues that will be affected before making changes.

**FoD — list unreviewed critical/high issues:**
```bash
fcli fod issue list \
  --rel "<AppName>:<ReleaseName>" \
  --query "severity in ('Critical','High') && reviewStatus=='Not Reviewed'" \
  -o json
```

**SSC — list unreviewed critical/high issues:**
```bash
fcli ssc issue list \
  --av "<AppName>:<VersionName>" \
  --query "friority in ('Critical','High') && primaryTag==null" \
  -o json
```

Show the issue count and a summary table before proceeding. If more than 50 issues are in scope, present the count and ask for explicit confirmation before running any update.

---

### Step 2: Update Audit State in Bulk

**FoD — update a set of issues:**

FoD does not expose a direct bulk audit update via fcli. Use `fcli fod rest call` to POST to the audit endpoint for each `instanceId`. The recommended pattern is to store the list, then iterate:

```bash
# Store filtered issue list
fcli fod issue list \
  --rel "<AppName>:<ReleaseName>" \
  --query "<filter>" \
  --store issues -o none

# Then reference individual instanceIds from the stored list
# Review the stored output and call the audit endpoint per issue or via a loop
```

Confirm with the user whether they want to proceed one-by-one or accept a loop operation across all matched IDs.

**SSC — bulk audit update:**
```bash
fcli ssc issue update \
  --av "<AppName>:<VersionName>" \
  --query "<filter>" \
  --analysis "<TargetAnalysisValue>" \
  --comment "<Justification>"
```

The `--analysis` value must match SSC's accepted review status vocabulary: `Not Reviewed`, `Reliability Issue`, `Bug`, `Suppressed`, `False Positive`, `Risk Accepted`.

---

### Step 3: Apply or Update Custom Tags in Bulk

**SSC — set a custom tag value on filtered issues:**
```bash
fcli ssc issue update \
  --av "<AppName>:<VersionName>" \
  --query "<filter>" \
  --tag "<CustomTagName>=<Value>"
```

List available custom tags before applying to confirm the tag name and allowed values:
```bash
fcli ssc custom-tag list --av "<AppName>:<VersionName>" -o json
```

---

### Audit Coverage Check

To check what percentage of issues have received a human review decision:

**SSC:**
```bash
# Total issues
fcli ssc issue count --av "<AppName>:<VersionName>"

# Issues with a decision (not "Not Reviewed")
fcli ssc issue count \
  --av "<AppName>:<VersionName>" \
  --query "primaryTag!='Not Reviewed' && primaryTag!=null"
```

**FoD:**
```bash
# Total issues
fcli fod issue list --rel "<AppName>:<ReleaseName>" -o json | wc -l

# Reviewed
fcli fod issue list \
  --rel "<AppName>:<ReleaseName>" \
  --query "reviewStatus!='Not Reviewed'" \
  -o json | wc -l
```

Divide reviewed by total to get coverage percentage. Surface this to the user when they are tracking progress toward a review gate.

---

### Decision Guardrails

- Do not change issue state without listing affected issues first.
- For suppression of more than 50 issues: show list + count, require explicit confirmation.
- Always require a `--comment` or justification for `Suppressed` and `Risk Accepted` updates.
- Do not mix `Suppressed` and `False Positive` — they have different compliance implications. `False Positive` is a developer determination; `Suppressed` may mean "valid but not relevant in this context."
