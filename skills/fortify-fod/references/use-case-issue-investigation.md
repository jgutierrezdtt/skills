## Use Case: Issue Investigation — Analytics, Drilling In, and Triage

> If the release name is not already resolved, load `references/resolving-release.md` first.

This use case covers the full issue workflow in sequence:
1. **Analytics** — understanding the vulnerability landscape at a high level
2. **Investigation** — filtering to and reading specific issues
3. **Triage / Audit Updates** — marking issues as false positive, suppressed, or assigning developer status

These stages flow naturally together in a single session. Work through them in order.

---

### Stage 1: Issue Analytics — Getting a Sense of What's There

The user wants to understand the vulnerability landscape for a release without drilling into individual issues (e.g., "how many critical issues does this release have?", "what categories are most common?", "show me new issues from the latest scan").

**Always prefer precomputed release-level counts** for totals — much faster than listing issues:
```bash
fcli fod release get "<AppName:ReleaseName>" -o json
# → use fields: critical, high, medium, low, staticCritical, openSourceHigh, issueCount, isPassed
```

**Use issue list for filtered counts or category breakdowns:**
```bash
# Count new critical issues
fcli fod issue list --rel=<releaseNameOrId> --query "status=='New' && severityString=='Critical'" -o json \
  | python -c "import sys,json; print(len(json.load(sys.stdin)))"

# All visible issues — summarize by category, severity, etc.
fcli fod issue list --rel=<releaseNameOrId> -o json

# Only new issues from the latest scan
fcli fod issue list --rel=<releaseNameOrId> --query "status=='New'" -o json

# Include fixed issues (to show remediation progress)
fcli fod issue list --rel=<releaseNameOrId> --include=visible,fixed \
  --query "{'Fixed','New'}.contains(status)" -o json
```

**Do not count table rows.** Use JSON + python for filtered counts, or release aggregate fields for totals.

**Server-side filtering** — equality and OR `--query` expressions are auto-converted to FoD server-side filters. Use `--filters-param` to override directly (see `references/fcli-query-output.md`).

---

### Stage 2: Issue Investigation — Drilling Into Specific Issues

The user wants to understand and remediate a specific set of issues (e.g., "show me the SQL injection issues in UserController", "what are the recommendations for the top 5 critical issues", "find all issues in the payment module").

**Two-step approach:**

**Step 1 — Filter to a target list** (standard list, fast):
```bash
# By file / location
fcli fod issue list --rel=<releaseNameOrId> \
  --query "primaryLocation matches '(?i).*UserController.*'" -o json

# By category
fcli fod issue list --rel=<releaseNameOrId> \
  --query "category=='SQL Injection'" -o json

# By severity + status
fcli fod issue list --rel=<releaseNameOrId> \
  --query "severityString=='Critical' && status=='New'" -o json

# By instanceId (specific known issues)
# Note: FoD API returns HTTP 500 when multiple instanceIds are passed as a set filter.
# Use a single equality query per instanceId:
fcli fod issue list --rel=<releaseNameOrId> \
  --query "instanceId=='AAAA...'" -o json

# By Aviator eligibility (AI remediation available)
fcli fod issue list --rel=<releaseNameOrId> \
  --query "aviatorRemediationGuidanceAvailable==true" -o json
```

**Step 2 — Augment with detail** using `--embed` (expensive — FoD rate limits apply):

> ⚠️ Each embedded field makes a separate HTTP request per issue. **Limit to 10–20 issues at a time.** Always filter first; never embed on a full unfiltered list.

```bash
# Get description + recommendations for a small filtered set
fcli fod issue list --rel=<releaseNameOrId> \
  --query "category=='SQL Injection' && severityString=='Critical'" \
  --embed=summary,details,recommendations -o json
```

Available embed values: 
- All issue types: `summary`, `details`, `recommendations`, `history`
- Static issues only: `traces`
- Dynamic issues only: `requestResponse`, `headers`, `parameters`
- Do not use the `allData` embed value as it is heavily rate limited.  

For field definitions (e.g., `source`, `sink`, `auditorStatus`, compliance mappings, Aviator flags), load `references/fcli-fod-output-values.md`.

---

### Stage 3: Updating Issues — Bulk Audit Updates

The user wants to triage a set of issues: mark as false positive, suppress, add a comment, change developer status, or override severity (e.g., "mark these as remediation required", "set all the test-only path issues to not an issue with a comment", "assign these to me").

This is a direct follow-on to Stage 2 — filter first, then update. `fcli fod issue update` affects all IDs provided in a single call; treat it as a bulk operation regardless of count and always confirm before executing (per Safety Rules in the main SKILL.md).

**Step 1 — Filter to the target set** (use Stage 2 above).

**Step 2 — Identify the field and value updates**

Updatable fields:

| Flag | Purpose |
|------|---------|
| `--auditor-status` | Suppression / review state |
| `--dev-status` | Developer workflow state |
| `--severity` | Override severity: `Low`, `Medium`, `High`, `Critical`, `Info`, `Best Practice` |
| `--user` | Assigned username |
| `--comment` | Audit comment applied to all updated issues |
| `--attrs` | Custom attribute `name=value` pairs |

When updating Auditor or Developer Status, review default values in `references/fcli-fod-output-values.md`.

Always include `--comment` explaining the rationale. This creates an audit trail that future reviewers can follow.

**Step 3 — Present the proposed change**

Before presenting the update to the user, self-verify:

- [ ] Target issue set fully filtered — IDs, categories, and severities reviewed
- [ ] Auditor/developer status values verified as valid for this tenant (check `references/fcli-fod-output-values.md` if uncertain)
- [ ] `vulnId` (UUID) values extracted — NOT the numeric `id`
- [ ] If changing `auditorStatus` to a suppressing value (`Not an Issue`, `False Positive`): suppression impact understood — these issues will disappear from default views and be excluded from policy metrics

Summarize to the user:
- Which issues will be updated (count, categories, severities)
- What will change (auditor status, developer status, severity override, assigned user, comment, custom attributes)

> ⚠️ Changing `auditorStatus` may **suppresses** issues based on the desired status — they disappear from default views and are excluded from policy metrics. Confirm the user understands suppression is intended.

Wait for explicit user confirmation before proceeding.

**Step 4 — Extract vuln IDs**

`--vuln-ids` accepts the UUID `vulnId` field from `fcli fod issue list` JSON output. Always use `vulnId` — not the numeric `id`:
```bash
fcli fod issue list --rel=<releaseNameOrId> --query "..." -o json | \
  python -c "import sys,json; print(','.join(str(i['vulnId']) for i in json.load(sys.stdin)))"
```

**Step 5 — Run the update**
```bash
fcli fod issue update \
  --rel=<releaseNameOrId> \
  --user=<username> \
  --auditor-status="Not an Issue" \
  --comment="Auto-generated utility code; not reachable from production entry points" \
  --vuln-ids=<uuid1>,<uuid2>,<uuid3>
```


