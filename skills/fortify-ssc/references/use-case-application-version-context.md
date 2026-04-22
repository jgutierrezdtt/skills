## Use Case: Application Version Context — Understanding a Specific App or Version

Use this for any task scoped to one application or a small number of named versions:
- Understanding details about a specific application or version
- Resolving app/version names to use in other commands (`--av`)
- Comparing versions within the same application (e.g., `main` vs `dev`)
- Checking version health, metrics, and current state

> For broad comparisons across many applications simultaneously, use the Portfolio Overview use case instead.

---

### Resolving App and Version Names

See `references/resolving-appversion.md` for the full resolution workflow — priority order, verification commands, `--av` identifier format, delimiter handling, and `--store` variable chaining. Apply that before any command in this use case that requires `--av`.

---

### Interpreting Version Health (`currentState`)

Version-level health data is embedded in `currentState`. Key fields to look for:

| Field | Meaning |
|-------|---------|
| `analysisResultsExist` | At least one artifact has been successfully processed |
| `attentionRequired` | Version needs admin attention (e.g., processing error) |
| `lastFprUploadDate` | When the most recent FPR was uploaded |
| `issueCountDelta` | Change in total issue count over the delta period (default: 7 days) |
| `criticalPriorityIssueCountDelta` | Change in critical issues count over the delta period |
| `percentAuditedDelta` | Change in overall audit percentage over the delta period |
| `metricEvaluationDate` | When performance indicators were last computed |

---

### Issue Counts for a Version

For quick severity totals, use `issue count` — much faster than listing individual issues:
```bash
fcli ssc issue count --av="<AppName>:<VersionName>" -o json
```

Returns counts by severity folder (Critical/High/Medium/Low), including `totalCount`, `auditedCount`, and `visibleCount` per folder. See `references/fcli-ssc-output-values.md` for field details.

---

### Version Attributes

Attributes are tenant-defined metadata fields that provide business and technical context:
```bash
fcli ssc attr list --av="<AppName>:<VersionName>" -o json
```

Common built-in attributes: `DevPhase`, `BusinessRisk`, `InfoClassification`, `Languages`, `TargetPlatform`. See `references/fcli-ssc-output-values.md` for the full list.

---

### Performance Indicators and Variables

For audit progress metrics:
```bash
# Percentage-based metrics (e.g., % Critical Audited, % Issues Audited)
fcli ssc pi list --av="<AppName>:<VersionName>" -o json

# Tenant-defined numeric metrics
fcli ssc var list --av="<AppName>:<VersionName>" -o json
```

---

### Comparing Versions

**Compare issue counts between two versions** (fast — uses `issue count`, no issue-level queries needed):
```bash
fcli ssc issue count --av="SampleWebApp:main" -o json
fcli ssc issue count --av="SampleWebApp:dev" -o json
```

**Deduplicate issues across two versions** using `issueInstanceId` (for "is this issue also in the other version?" questions):
```bash
# Fetch issue lists from two versions
fcli ssc issue list --av="SampleWebApp:main" -o json --to-file main-issues.json
fcli ssc issue list --av="SampleWebApp:dev"  -o json --to-file dev-issues.json
# Then compare issueInstanceId sets to find issues in one but not the other
python -c "
import json
main = {i['issueInstanceId'] for i in json.load(open('main-issues.json'))}
dev  = {i['issueInstanceId'] for i in json.load(open('dev-issues.json'))}
print('Only in main:', len(main - dev))
print('Only in dev:',  len(dev - main))
print('In both:',      len(main & dev))
"
```

`issueInstanceId` is the stable cross-scan identifier — do not use `id` for this.

---

### Filter Sets

Each version can have multiple filter sets. Queries and issue counts apply within the active filter set.

```bash
# List available filter sets for a version
fcli ssc issue list-filtersets --av="<AppName>:<VersionName>" -o json

# Use a specific filter set when listing or counting issues
fcli ssc issue list --av="<AppName>:<VersionName>" --fs="Quick View" -o json
fcli ssc issue count --av="<AppName>:<VersionName>" --fs="Quick View" -o json
```

The default is "Security Auditor View" (Critical/High/Medium/Low folders).
