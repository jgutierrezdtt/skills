## Use Case: Issue Investigation — Analytics, Drilling In, and Triage

> If the application version name is not already resolved, load `references/resolving-appversion.md` first.

This use case covers the full issue workflow in sequence:
1. **Analytics** — understanding the vulnerability landscape at a high level
2. **Investigation** — filtering to and reading specific issues
3. **Triage / Audit Updates** — suppressing issues, setting custom tags, assigning users

These stages flow naturally together in a single session. Work through them in order.

---

### Stage 1: Issue Analytics — Getting a Sense of What's There

The user wants to understand the vulnerability landscape for a version without drilling into individual issues (e.g., "how many critical issues does this version have?", "what categories are most common?", "show me new issues from the latest scan").

**Always prefer `issue count` for totals** — much faster than listing all issues:
```bash
fcli ssc issue count --av="<AppName>:<VersionName>" -o json
```

Returns counts per folder (Critical/High/Medium/Low) with `totalCount`, `auditedCount`, and `visibleCount`. Use specific folder data to compute metrics (e.g., percent audited = `auditedCount / totalCount`).

**Use a specific filter set** for different views (e.g., Quick View):
```bash
fcli ssc issue count --av="<AppName>:<VersionName>" --fs="Quick View" -o json
```

**Use issue list for filtered counts or category breakdowns:**
```bash
# Count new issues from the latest scan
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --query "scanStatus=='NEW'" -o json | \
  python -c "import sys,json; print(len(json.load(sys.stdin)))"

# Count critical new issues
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --query "friority=='Critical' && scanStatus=='NEW'" -o json | \
  python -c "import sys,json; print(len(json.load(sys.stdin)))"

# All visible issues — summarize by category, analyzer, etc.
fcli ssc issue list --av="<AppName>:<VersionName>" -o json

# Include suppressed issues
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --include=visible,suppressed -o json

# Include removed issues (fixed — no longer found in latest scan)
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --include=visible,removed -o json
```

**Check performance indicators** for audit progress:
```bash
fcli ssc pi list --av="<AppName>:<VersionName>" -o json
# → PercentCriticalPriorityIssuesAudited, PercentIssuesAudited, etc.
```

**Do not count table rows.** Use JSON + Python for filtered counts.

---

### Stage 2: Issue Investigation — Drilling Into Specific Issues

The user wants to understand and investigate specific issues (e.g., "show me the SQL injection issues in UserController", "find all unreviewed critical issues", "which file has the most high-severity issues").

**Filter to a target list:**
```bash
# By file / location
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --query "fullFileName matches '(?i).*UserController.*'" -o json

# By category (issueName is the full category; matches returns partial categories too)
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --query "issueName matches '(?i).*SQL Injection.*'" -o json

# By exact category
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --query "issueName=='SQL Injection: MyBatis Mapper'" -o json

# By priority (note: field name is 'friority' — historical typo in SSC)
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --query "friority=='Critical'" -o json

# By scan status (NEW, UPDATED, REINTRODUCED)
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --query "scanStatus=='NEW'" -o json

# By analyzer type
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --query "analyzer=='Data Flow'" -o json

# Unreviewed issues only
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --query "audited==false" -o json

# By assigned user
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --query "assignedUser=='jsmith'" -o json

# By issueInstanceId (to find specific known issues)
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --query "{'D2A7806BEC05EE2CD1171AA38673F6AB','7062F805327F3B7989D24745B63A0248'}.contains(issueInstanceId)" -o json
```

**Apply named filters** defined in SSC:
```bash
# List available named filters
fcli ssc issue list-filters --av="<AppName>:<VersionName>" -o json

# Apply a filter by name or ID
fcli ssc issue list --av="<AppName>:<VersionName>" --filter="<filterName>" -o json
```

**Augment with additional details using `--embed`:**

> Each embedded field makes additional HTTP requests to SSC. Limit to targeted subsets of issues when embedding. Always filter first.

```bash
# Get issue details and audit comment history for a small filtered set
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --query "issueName matches '(?i).*SQL Injection.*' && friority=='Critical'" \
  --embed=details,comments -o json
```

Available embed values:
- `details` — extended issue details (description, impact, remediation guidance)
- `comments` — audit comment history
- `auditHistory` — full audit trail for the issue

For field definitions (`friority`, `issueInstanceId`, `scanStatus`, `primaryTag`, `visibility`, etc.), see `references/fcli-ssc-output-values.md`.
For filter set and folder structure, see `references/use-case-application-version-context.md`.

---

### Stage 3: Updating Issues — Bulk Audit Updates

The user wants to triage a set of issues: suppress, set custom tag values, add a comment, or assign to a user (e.g., "mark these as Not an Issue", "suppress all the test-path XSS issues", "assign the critical issues to alice").

This is a direct follow-on to Stage 2 — filter first, then update. `fcli ssc issue update` affects all IDs provided in a single call; treat it as a bulk operation regardless of count and always confirm before executing (per Safety Rules in the main SKILL.md).

**Step 1 — Filter to the target set** (use Stage 2 above).

**Step 2 — Discover available custom tags** for this version:
```bash
fcli ssc custom-tag list --av="<AppName>:<VersionName>" -o json
```

The most common tag is `Analysis`, which typically has values like `Not an Issue`, `Exploitable`, `Suspicious`, `Reliability Issue`. The exact available values are tenant-configurable.

**Step 3 — Present the proposed change**

Before presenting the update to the user, self-verify:

- [ ] Target issue set fully filtered — IDs, categories, and priorities reviewed
- [ ] Custom tag names and values verified against `fcli ssc custom-tag list` output for this version
- [ ] Numeric `id` values extracted for `--issue-ids` — NOT `issueInstanceId`
- [ ] If setting `--suppress=true`: suppression impact understood — these issues will be hidden from default views and excluded from audit metrics

Summarize to the user:
- Which issues will be updated (count, categories, severities, files)
- What will change (suppression, custom tag values, assigned user, comment)

> ⚠️ Setting `--suppress=true` **hides issues from default views** and audit metrics. Confirm the user understands suppression is intended.

Wait for explicit user confirmation before proceeding.

**Step 4 — Extract issue IDs**

`--issue-ids` accepts the numeric `id` from `fcli ssc issue list`. Use `id` (not `issueInstanceId`) for the update command:
```bash
fcli ssc issue list --av="<AppName>:<VersionName>" \
  --query "issueName matches '(?i).*SQL Injection.*'" -o json | \
  python -c "import sys,json; print(','.join(str(i['id']) for i in json.load(sys.stdin)))"
```

**Step 5 — Run the update**

```bash
# Suppress issues and set a custom tag
fcli ssc issue update \
  --av="<AppName>:<VersionName>" \
  --suppress=true \
  --custom-tags="Analysis=Not an Issue" \
  --comment="Auto-generated test scaffolding; not reachable from production entry points" \
  --issue-ids=<id1>,<id2>,<id3>

# Set a custom tag without suppressing
fcli ssc issue update \
  --av="<AppName>:<VersionName>" \
  --custom-tags="Analysis=Exploitable" \
  --comment="Confirmed exploitable — tracked in JIRA-1234" \
  --issue-ids=<id1>,<id2>

# Assign issues to a user
fcli ssc issue update \
  --av="<AppName>:<VersionName>" \
  --assign-user="alice" \
  --comment="Assigned to Alice for remediation" \
  --issue-ids=<id1>,<id2>,<id3>

# Unsuppress previously suppressed issues
fcli ssc issue update \
  --av="<AppName>:<VersionName>" \
  --suppress=false \
  --comment="Code path changed; re-evaluating suppression" \
  --issue-ids=<id1>
```

**Updatable fields via `fcli ssc issue update`:**

| Flag | Purpose |
|------|---------|
| `--suppress=true\|false` | Suppress or unsuppress the issue |
| `--custom-tags TAG=VALUE` | Set a custom tag value (e.g., `Analysis=Not an Issue`) |
| `--assign-user=<username>` | Assign the issue to a user |
| `--comment=<text>` | Add an audit comment to all updated issues |

Always include `--comment` with an explanatory rationale. This creates an audit trail that future reviewers can follow.

> **Keep `--comment` text plain ASCII.** SSC's audit endpoint (`POST /api/v1/projectVersions/<id>/issues/action/audit`) returns HTTP 500 when a comment contains non-ASCII characters such as em-dashes (`—`), en-dashes (`–`), curly quotes (`"`, `'`), or other "smart" punctuation. Use plain ASCII substitutes (`-`, `--`, `"`, `'`). This is an SSC server-side limitation, not an fcli bug — it will not surface a clearer error message. If you've drafted a comment with smart punctuation (often inserted automatically), strip it before sending.

> **Multiple custom tags** can be set in a single call: `--custom-tags="Analysis=Not an Issue,Priority=Low"`. Use comma separation or repeat the flag.

> **After updating**, metrics may not refresh immediately. Run `fcli ssc appversion refresh-metrics "<AppName>:<VersionName>"` (positional argument, not `--av`) if current performance indicator values are needed right away.
