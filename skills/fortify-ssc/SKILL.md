---
name: fortify-ssc
description: "Perform any task on Fortify SSC (Software Security Center), a.k.a. OpenText Application Security Center. Use whenever the user asks about applications, application versions, artifacts, scans, issues, vulnerabilities, findings, auditing, triage, security posture, AppSec metrics, or compliance status in SSC. Also triggers for: starting or running a SAST scan (via ScanCentral SAST) or a DAST scan (via ScanCentral DAST); scanning code or submitting code for analysis; uploading FPR artifacts or importing scan results; filtering or counting vulnerabilities; policy compliance assessment; onboarding or creating a new application or version; artifact processing status; portfolio-level analysis; ScanCentral SAST or DAST scan job status, sensor health, or scan throughput; FPR downloads; or any SSC data query — even if the user doesn't explicitly say \"SSC\"."
license: MIT
metadata:
  version: "1.0.0"
  tested-with:
    fcli: "3.18"
    ssc: "25.4"
---

Fortify Software Security Center (SSC) is a self-hosted application security platform. It manages SAST, DAST, and open source scan results across a portfolio of applications by ingesting uploaded artifact files (FPRs). Users can also import results from ScanCentral, WebInspect, and third-party tools.

You interact with SSC using `fcli`. It must already be on the PATH. If it is not installed, activate the `fcli-common` skill for installation instructions.

## Platform Disambiguation

If the user's request is ambiguous (e.g., they say "run a SAST scan" without specifying SSC or FoD), determine which platform they are using before proceeding:

```bash
fcli ssc session ls --query "expired=='No'"
fcli fod session ls --query "expired=='No'"
```

- If only an SSC session is active — proceed with this skill.
- If only a FoD session is active — switch to the `fortify-fod` skill.
- If both are active — ask the user which platform they want to use.
- If neither is active — ask the user which platform they are using, then prompt them to log in using the appropriate platform skill.

## SSC Logical Structure and Nomenclature

- **Applications** — top-level organizational unit; one per software project. **In fcli `--query` expressions and fcli output, the field is always `application` (e.g., `application.name`, `application.id`) — never `project.name`.** The "project" wording only appears in raw REST paths (`/api/v1/projects/`) and a handful of legacy ID-only fields like `projectVersionId`. Do not use `project.*` as a query field.
- **Application Versions** — versions/branches within an application (e.g., `main`, `v2.1`); each holds independent scan results and issues. A version can be seeded by copying state from another.
- **Artifacts** — FPR files uploaded to an application version containing scan results from one or more scan engines. After SSC processes an artifact, issues are updated on the version.
- **Issues** — vulnerabilities found by scans; always scoped to an application version.
- **Custom Tags** — tenant-defined metadata fields for auditing issues (e.g., `Analysis`, `Comment`). These are the primary mechanism for recording audit decisions in SSC.
- **Filter Sets** — rulesets that control how issues are grouped into priority folders. The default is "Security Auditor View" (Critical/High/Medium/Low).
- **Performance Indicators** — computed percentage metrics (e.g., % Critical Audited).
- **Variables** — tenant-defined numeric metrics derived from issue counts.

Teams typically structure SSC with one application per repo and versions per branch or environment (e.g., `main`, `v25.1`, `staging`).

## Key Concepts

### Issue Priority (Fortify Priority Order)
SSC organizes issues into named folders within a filter set using the **Fortify Priority Order (FPO)**: `Critical`, `High`, `Medium`, `Low`. The `friority` field (note: historical typo) is the primary priority indicator used in the UI and in queries. Do not confuse with the raw `severity` score (0.0–5.0).

### Scan Status (system-assigned per scan cycle)
`NEW` (first seen in latest scan), `UPDATED` (seen before, seen again), `REINTRODUCED` (was removed, now re-detected). Use `--query "scanStatus=='NEW'"` etc.

### Issue Visibility and `--include`
By default `fcli ssc issue list` returns **visible (non-suppressed, non-removed) issues only**.
- `--include=visible,suppressed` — add suppressed issues
- `--include=visible,removed` — add fixed/removed issues
- `--include=visible,suppressed,removed,hidden` — all issues

Visibility states: `visible`, `suppressed` (audit decision), `removed` (not found in latest scan), `hidden` (filtered by active filter).

### Audit Decisions — Custom Tags
SSC audit decisions are recorded via **custom tags**, not a fixed status enum. The most common is the `Analysis` tag with values like `Not an Issue`, `Exploitable`, `Reliability Issue`, `Suspicious`. The exact tags and values available depend on the tenant configuration. Use `fcli ssc custom-tag list --av=<appVersionNameOrId>` to discover them.

Suppression in SSC is an explicit boolean: `--suppress=true` via `fcli ssc issue update`. It is independent of custom tag values.

### Stable Issue Identity
Always use `issueInstanceId` (32-character hex string) as the canonical key for correlating the same issue across scans or versions. Do NOT use `id` (numeric, changes on reprocessing) for deduplication. Note: FoD calls the equivalent field `instanceId`.

### `--av`: The Only Version Identifier for Issue and Artifact Commands
`fcli ssc issue list`, `fcli ssc issue get`, `fcli ssc issue update`, `fcli ssc artifact list`, and all other version-scoped commands use **`--av` as the sole version identifier**. There is no separate `--app` or `--version` flag on these commands — do not invent one.

`--av` accepts a bare numeric version ID **or** a name string:
- Numeric ID (preferred when known): `--av=20001`
- Name string: `--av="MyApp:main"`

**When the user supplies a numeric version ID, use it directly as `--av=<id>` and skip all name-resolution steps.** A numeric version ID is globally unique in SSC — no application context is required alongside it.

### Querying Applications and Versions — Use `--query`, Not `--app`

`fcli ssc app list` and `fcli ssc appversion list` have **no `--app` flag** either. To filter them by application name, use `--query`:

```bash
# Find an application by name
fcli ssc app list --query "name=='Solidity Example'" -o json

# Find all versions of an application
fcli ssc appversion list --query "application.name=='Solidity Example'" -o json

# Find one specific version
fcli ssc appversion list --query "application.name=='Solidity Example' && name=='main'" -o json
```

The query field on `appversion list` is **`application.name`** (the version object embeds the parent application as `application`). It is **not** `project.name`, `app.name`, or `applicationName` — those are wrong on SSC. Names are case-sensitive. See `references/resolving-appversion.md` for fuzzy matching, delimiters, and `--store` chaining.

## Reference Files

Load these **only when needed** for the specific task at hand:

| File | When to load |
|------|--------------|
| `references/resolving-appversion.md` | Whenever you need to resolve an app or version name to an `--av` identifier and it isn't already explicit |
| `references/fcli-ssc-output-values.md` | Full field/enum reference for apps, versions, artifacts, issues, filter sets, attributes, performance indicators, variables |
| `references/fcli-ssc-output-samples.md` | Concrete JSON output examples for every object type (app, version, artifact, issue, issue count, filter set) |
| `references/fcli-query-output.md` | Detailed SpEL query syntax, null-safety patterns, output formats, `--store` variable chaining, server-side filtering, date utility functions |
| `references/fcli-install.md` | Full fcli installation and upgrade procedures |
| `references/ssc-openapi-spec.json` | **Only** when constructing `fcli ssc rest` API calls — large file; load targeted sections only |
| `references/scdast-openapi-spec.json` | **Only** when constructing direct SC-DAST REST API calls (via `fcli sc-dast rest`) for operations not covered by named `fcli sc-dast` commands — large file; load targeted sections only |

## Use Case Files

Read the corresponding file before proceeding with any use case. Do not generate commands from memory — these files contain required command patterns, error states, and safety steps specific to each workflow. If a request spans multiple use cases, load all relevant files before proceeding.

| Use Case | When to use | File |
|----------|-------------|------|
| **Portfolio Overview** | Broad view across many applications or versions — listing, counting, grouping by status or activity, identifying versions needing attention at scale | `references/use-case-portfolio-overview.md` |
| **Application Version Context** | Detail about a specific application or version; resolving app/version names and `--av` identifiers; comparing versions within the same app; checking version health and metrics | `references/use-case-application-version-context.md` |
| **Creating an App or Version** | Onboarding a new project to SSC; creating a new application version for a branch, release, or environment | `references/use-case-creating-app-or-version.md` |
| **Artifact Upload & Processing** | Uploading FPR scan results to an application version; monitoring artifact processing status; checking upload history; handling processing errors | `references/use-case-artifact-upload-processing.md` |
| **Issue Investigation** | Vulnerability counts and category breakdowns for a specific version; filtering to specific issues; reading issue details; triaging and bulk-updating audit status or suppression | `references/use-case-issue-investigation.md` |
| **Start a Scan** | Submitting a new SAST scan via ScanCentral SAST or a new DAST scan via ScanCentral DAST; choosing how to run the scan (web UI, CI/CD, IDE plugin, or CLI); packaging code; checking for in-progress scans; waiting for completion; summarizing results | `references/use-case-start-scan.md` |
| **ScanCentral SAST Scan Status** | Observing SC-SAST scan jobs (listing running/queued/completed/failed jobs, filtering by time or submitter, counting throughput); checking sensor and pool utilization; downloading FPRs, logs, or sensor logs from completed jobs | `references/use-case-scsast-scan-status.md` |
| **ScanCentral DAST Scan Status** | Observing SC-DAST scans (listing running/queued/paused/complete/failed scans, filtering by state, time window, app, or URL); checking finding counts; sensor health and pool membership; downloading FPRs, results, logs, settings, or site trees | `references/use-case-scdast-scan-status.md` |
| **Advanced / REST API** | Operations not covered by named fcli commands; direct SSC REST API calls; general fallback | `references/use-case-advanced.md` |

---

## Verify Authentication

Check for an active session before any operation (skip if already confirmed this conversation):
```
fcli ssc session ls --query "name=='default' && expired=='No'"
```
In CI/CD contexts where tokens may be revoked between runs, use `--validate` to confirm token validity server-side: `fcli ssc session ls --validate`
- **fcli not found**: Do NOT silently download or execute anything. Ask the user how they want to install fcli. Load `references/fcli-install.md` for full procedures. Quick options: `npx @fortify/setup env init --tools=fcli:auto` (requires Node.js) or download from https://github.com/fortify/fcli/releases. Verify: `fcli --version`
- **No data returned**: instruct the user to run `fcli ssc session login`

---

## Never bypass fcli for SSC API access

All SSC API access must go through fcli — including when fcli seems slow or limited. **Never** read fcli's session or state files (`~/.fortify/fcli/state`, `$FCLI_STATE_DIR`), extract tokens or credentials from disk, or call SSC APIs directly with `curl`, `wget`, `requests`, `Invoke-WebRequest`, or any other HTTP client. The supported escape hatch for endpoints not covered by a named command is `fcli ssc rest call`. If fcli is genuinely unworkable for the task, tell the user — do not work around it.

---

## Safety Rules for Mutating Operations

> These rules apply before running ANY command that modifies, creates, or deletes data. Read-only commands (`list`, `get`, `ls`, `count`) are always safe to run without confirmation.

### Delete — never run without explicit confirmation

`fcli ssc <module> delete` and `fcli ssc rest call -X DELETE` are **irreversible**.

Before any delete:
1. Run the equivalent `list` command with the same filters and show the user **exactly** what would be deleted: names, count, and any associated data at risk (e.g., deleting an application version also deletes all its artifacts and issues).
2. State explicitly: "This will permanently delete [X]. Do you want to proceed?"
3. **Do not proceed until the user confirms.** Do not infer consent from the original request.
4. After the user confirms, ask once more: "Just to be sure — this action is irreversible. Please confirm you want to permanently delete [X]."
5. Only execute after receiving **two separate confirmations**.

If a non-destructive alternative exists (e.g., deactivating a version rather than deleting it), suggest it first.

### Create and Update — require confirmation before executing

For `fcli ssc <module> create` and `fcli ssc <module> update`:

**Single resource**: Summarize what will be created or changed (field name, new value), then wait for explicit user confirmation.

**Bulk operations** — any command that affects more than one resource (e.g., updating issues matching a broad filter, modifying multiple versions):
- List the affected resources first so the user can see the full scope.
- Require explicit confirmation before proceeding. Treat with the same caution as delete.

### Access Control — elevated caution

Operations under `fcli ssc access-control` (users, roles, tokens) can silently expand or revoke access across the entire SSC instance.

- State clearly **who** will be affected and **what access** will change (granted or revoked).
- Require explicit user confirmation for every operation — including single-user changes.
- After the user confirms, ask a second time: "Access control changes can have broad security implications. Please confirm once more that you want to [grant/revoke] [role/permission] for [user/group]."
- Only execute after receiving **two separate confirmations**.
- **Never grant admin or instance-wide roles** without presenting the exact proposed change and receiving two clear confirmations.

### REST passthrough (`fcli ssc rest`)

`-X POST` / `-X PUT` / `-X PATCH` → treat as create/update (confirmation required).
`-X DELETE` → treat as delete (never execute without explicit user confirmation).

---

## Output Formats

**Prefer `-o json` for all programmatic work.** Parse the JSON and summarize results rather than relying on table output. Table output omits fields and truncates values.

| Format | Use case |
|--------|---------|
| `-o json` | Programmatic processing, counting, field access — **recommended default** |
| `-o table` | Quick human-readable overview |
| `-o csv=field1,field2` | Specific field extraction |
| `-o expr='{field1},{field2}\n'` | Custom text format per record |
| `--fetch=1 -o json` | Sample a single record from the server to discover field names and values — faster than downloading a full page (available on most `list` commands) |

### JSON Processing

**Preferred approach**: Run commands with `-o json` and parse the JSON output directly in your reasoning — you are the JSON processor. This is the most portable approach and avoids dependency on external tools.

When you need to extract values for use in a follow-up terminal command (e.g., extracting IDs from a list to pass to an update), write a small inline script using the language runtime available in the user's environment. Python is widely available on both Linux/Mac and Windows:
```bash
fcli ssc issue list --av="<AppName>:<VersionName>" --query "..." -o json | \
  python -c "import sys,json; print(','.join(str(i['id']) for i in json.load(sys.stdin)))"
```
If `python` is not on PATH, try `python3`.

For simple field extraction without scripting, use fcli's built-in formats:
```bash
fcli ssc issue list --av="<av>" -o csv=id                          # single field
fcli ssc issue list --av="<av>" -o expr='{id},{issueName}\n'       # custom format
```

For full output format, `--query` SpEL syntax, null-safety patterns, and `--store` variable chaining, see `references/fcli-query-output.md`.

For available fcli ssc modules and sub-commands, run `fcli ssc -h` or `fcli ssc <module> -h`.
