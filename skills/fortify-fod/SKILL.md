---
name: fortify-fod
description: "Perform any task on Fortify on Demand (FoD/OpenText Core Application Security). Use whenever the user asks about applications, releases, scans, issues, vulnerabilities, findings, auditing, triage, security posture, AppSec metrics, or compliance status in FoD. Also triggers for: scanning or analyzing code with a SAST, DAST, or SCA (open source) scan; filtering or counting vulnerabilities; policy pass/fail status; Aviator AI remediation; open source component inventory, license risk, or CVE impact analysis across releases; importing scan results (FPR, SARIF, or CycloneDX/SBOM) to use FoD as an ASPM platform; onboarding or creating a new application or release; portfolio-level analysis comparing many apps at scale; or any FoD data query — even if the user doesn't explicitly say \"FoD\"."
license: MIT
metadata:
  version: "1.0.0"
  tested-with:
    fcli: "3.18"
    fod: "26.1"
---

Fortify on Demand (FoD) is a SaaS application security platform. It manages SAST, DAST, SCA (open source), and mobile scan results across a portfolio of applications. Users can also import results from on-premise Fortify scans (FPRs), SARIF, and CycloneDX SBOMs.

You interact with FoD using `fcli`. It must already be on the PATH. If it is not installed, activate the `fcli-common` skill for installation instructions.

## Platform Disambiguation

If the user's request is ambiguous (e.g., they say "run a SAST scan" without specifying FoD or SSC), determine which platform they are using before proceeding:

```bash
fcli fod session ls --query "expired=='No'"
fcli ssc session ls --query "expired=='No'"
```

- If only a FoD session is active — proceed with this skill.
- If only an SSC session is active — switch to the `fortify-ssc` skill.
- If both are active — ask the user which platform they want to use.
- If neither is active — ask the user which platform they are using, then prompt them to log in.

## FoD Logical Structure and Nomenclature

- **Applications** — top-level organizational unit; one per software project
- **Microservices** — optional grouping within an application; each microservice has its own releases. Most applications don't use microservices.
- **Releases** — versions/branches within an application or microservice (e.g., `main`, `v2.1`); each holds independent scan results and issues. A release can be seeded by copying state from another.
- **Scans** — SAST (static), DAST (dynamic), SCA (open source / OSS), or MAST (mobile) analyses attached to a release
- **Issues** — vulnerabilities found by scans; always scoped to a release

Teams typically structure FoD with one app per repo and releases per branch or version (e.g., `main`, `v25.1`). See `references/use-case-creating-app-or-release.md` for full application design patterns — load that file when creating a new app or release, or when identifying the app or release you want to take action upon.

## Key Concepts

### Issue Status (system-assigned)
`New` (first seen), `Existing` (recurring), `Reopened` (was fixed), `Fixed` (not in latest scan, may be displayed as Fix Validated). Use `--query "status=='New'"` etc.

### Auditor Status (security decision — controls visibility)
Auditor Status is the **authoritative control for suppression**. An unreviewed issue has status `Pending Review`.
- **Suppressing** (hidden from default views and metrics): `Not an Issue`, `False Positive`
- **Non-suppressing** (visible and policy-relevant): `Remediation Required`, `Exploitable`
- Suppression persists across scans (tracked via `instanceId`)
- Values are tenant-customizable; see `references/fcli-fod-output-values.md` for full details

### Developer Status
Engineering workflow state (e.g., `Open`, `In Progress`, `Fixed`, `Deferred`). Tenant-customizable. **Does not affect suppression or policy.**

### Visibility and `--include`
By default `fcli fod issue list` returns **visible (non-suppressed) issues only**. This is what users expect unless they ask otherwise.
- `--include=visible,suppressed` — add suppressed issues
- `--include=visible,fixed` — add fixed issues
- `--include=visible,suppressed,fixed` — all issues

### Severity
`severity` is an integer: `4`=Critical, `3`=High, `2`=Medium, `1`=Low. `severityString` is the human-readable equivalent.

### Issue Counting
FoD does not have a dedicated `issue count` command. For severity totals, use precomputed release-level aggregate fields (`critical`, `high`, `medium`, `low`, `issueCount`) from `fcli fod release get` — this is fast and doesn't require listing issues. For filtered counts or category breakdowns, use `fcli fod issue list` with `-o json` and count the results. See the Issue Investigation use case for patterns.

### Open Source / SCA Components
FoD tracks open source component data from SCA scans (Debricked, Sonatype, or imported CycloneDX SBOMs). Release-level fields (`openSourceCritical`, `openSourceHigh`, etc.) provide aggregate vulnerability counts. For component-level detail — CVE impact triage, license risk, SBOM export — use the OSS Component Analysis use case.

### Fortify Aviator (AI-Assisted Audit)
FoD's Aviator feature provides AI-assisted issue review and remediation guidance. Issues with `aviatorRemediationGuidanceAvailable==true` have AI-generated fix recommendations. See `references/fcli-fod-output-values.md` for Aviator field definitions.

### Stable Issue Identity
Always use `instanceId` (UUID) as the canonical key for correlating the same issue across scans or releases. Do NOT use `id` (numeric) for deduplication. Note: SSC calls the equivalent field `issueInstanceId`.

### `--rel`: The Only Release Identifier for Issue and Scan Commands
`fcli fod issue list`, `fcli fod issue get`, `fcli fod issue update`, and all scan commands use **`--rel` as the sole release identifier**. There is no separate `--app` or `--release` flag on these commands — do not invent one.

`--rel` accepts a bare numeric release ID **or** a name string:
- Numeric ID (preferred when known): `--rel=1450004`
- Name string: `--rel="MyApp:main"` or `--rel="MyApp:svc:main"`

**When the user supplies a numeric release ID, use it directly as `--rel=<id>` and skip all name-resolution steps.** A numeric release ID is globally unique in FoD — no app context is required alongside it.

## Reference Files

Load these **only when needed** for the specific task at hand:

| File | When to load |
|------|--------------|
| `references/resolving-release.md` | Whenever you need to resolve an app or release name to a `--rel` identifier and it isn't already explicit |
| `references/fcli-fod-output-values.md` | Full field/enum reference for apps, releases, scans, issues; status/severity tables; Aviator semantics; available fcli modules |
| `references/fcli-fod-output-samples.md` | Concrete JSON output examples for every object type (app, release, scan, issue) |
| `references/fcli-query-output.md` | Detailed SpEL query syntax, null-safety patterns, output formats, `--store` variable chaining, server-side filtering, date utility functions |
| `references/fcli-install.md` | Full fcli installation and upgrade procedures |
| `references/fod-openapi-spec.json` | **Only** when constructing `fcli fod rest` API calls — large file (~18K lines); load targeted sections only |

## Use Case Files

Read the corresponding file before proceeding with any use case. Do not generate commands from memory — these files contain required command patterns, rate-limit warnings, and safety steps specific to each workflow. If a request spans multiple use cases, load all relevant files before proceeding.

| Use Case | When to use | File |
|----------|-------------|------|
| **Portfolio Overview** | Broad view across many apps or releases — listing, counting, grouping by criticality or SDLC status, identifying failing policy at scale | `references/use-case-portfolio-overview.md` |
| **Application Context** | Detail about a specific app or release; resolving app/release names and `--rel` identifiers; comparing releases within the same app or between two named apps/releases | `references/use-case-application-context.md` |
| **Creating an App or Release** | Onboarding a new project to FoD; creating a new release for a branch or version | `references/use-case-creating-app-or-release.md` |
| **Scan Status** | Whether scans have run, their results, in-progress or failed scans, last scan dates | `references/use-case-scan-status.md` |
| **Start Scan** | Submit a new SAST, SCA (open source), SAST+SCA, or DAST scan for a release; configure scan settings; package code; wait for results | `references/use-case-start-scan.md` |
| **Issue Investigation** | Vulnerability counts and category breakdowns for a specific app or release; filtering to specific issues; reading recommendations; triaging and bulk-updating audit status | `references/use-case-issue-investigation.md` |
| **OSS Component Analysis** | Open source component inventory and risk — finding all apps/releases using a specific component (CVE impact triage), investigating license types, reviewing OSS usage portfolio-wide or per application | `references/use-case-oss-component-analysis.md` |
| **Import Scan Results** | Importing security scan data from on-premises Fortify SAST/DAST (FPR files), third-party SAST/secret/IaC tools (SARIF), or third-party SCA/Container tools (CycloneDX SBOM); consolidating results into FoD as an ASPM single pane of glass | `references/use-case-import-scan-results.md` |
| **Advanced / REST API** | Operations not covered by named fcli commands; direct FoD REST API calls; general fallback | `references/use-case-advanced.md` |

---

## Verify Authentication

Check for an active session before any operation (skip if already confirmed this conversation):
```
fcli fod session ls --query "name=='default' && expired=='No'"
```
In CI/CD contexts where tokens may be revoked between runs, use `--validate` to confirm token validity server-side: `fcli fod session ls --validate`
- **fcli not found**: Do NOT silently download or execute anything. Ask the user how they want to install fcli. Load `references/fcli-install.md` for full procedures. Quick options: `npx @fortify/setup env init --tools=fcli:auto` (requires Node.js) or download from https://github.com/fortify/fcli/releases. Verify: `fcli --version`
- **No data returned**: instruct the user to run `fcli fod session login`

---

## Never bypass fcli for FoD API access

All FoD API access must go through fcli — including when fcli seems slow or limited. **Never** read fcli's session or state files (`~/.fortify/fcli/state`, `$FCLI_STATE_DIR`), extract tokens or credentials from disk, or call FoD APIs directly with `curl`, `wget`, `requests`, `Invoke-WebRequest`, or any other HTTP client. The supported escape hatch for endpoints not covered by a named command is `fcli fod rest call`. If fcli is genuinely unworkable for the task, tell the user — do not work around it.

---

## Safety Rules for Mutating Operations

> These rules apply before running ANY command that modifies, creates, or deletes data. Read-only commands (`list`, `get`, `ls`) are always safe to run without confirmation.

### Delete — never run without explicit confirmation

`fcli fod <module> delete` and `fcli fod rest call -X DELETE` are **irreversible**.

Before any delete:
1. Run the equivalent `list` command with the same filters and show the user **exactly** what would be deleted: names, count, and any associated data at risk (e.g., deleting an app also deletes all its releases, scans, and issues).
2. State explicitly: "This will permanently delete [X]. Do you want to proceed?"
3. **Do not proceed until the user confirms.** Do not infer consent from the original request.
4. After the user confirms, ask once more: "Just to be sure — this action is irreversible. Please confirm you want to permanently delete [X]."
5. Only execute after receiving **two separate confirmations**.

If a non-destructive alternative exists (e.g., disabling a user rather than deleting, marking a release inactive), suggest it first.

### Create and Update — require confirmation before executing

For `fcli fod <module> create` and `fcli fod <module> update`:

**Single resource**: Summarize what will be created or changed (field name, new value), then wait for explicit user confirmation.

**Bulk operations** — any command that affects more than one resource (e.g., updating all releases for an app, updating issues matching a broad filter, creating multiple users):
- List the affected resources first so the user can see the full scope.
- Require explicit confirmation before proceeding. Treat with the same caution as delete.

### Access Control — elevated caution

Operations under `fcli fod access-control` (users, groups, roles, API keys) can silently expand or revoke access across the entire tenant.

- State clearly **who** will be affected and **what access** will change (granted or revoked).
- Require explicit user confirmation for every operation — including single-user changes.
- After the user confirms, ask a second time: "Access control changes can have broad security implications. Please confirm once more that you want to [grant/revoke] [role/permission] for [user/group]."
- Only execute after receiving **two separate confirmations**.
- **Never grant admin or tenant-wide roles** without presenting the exact proposed change and receiving two clear confirmations.
- Any group membership change affecting 3 or more users counts as a bulk operation — list affected users before proceeding.

### REST passthrough (`fcli fod rest`)

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
| `-o json-properties` | List all queryable property names for a command |
| `--fetch=1 -o json` | Sample a single record to inspect actual field names and values — available on most `list` commands |

### JSON Processing

**Preferred approach**: Run commands with `-o json` and parse the JSON output directly in your reasoning — you are the JSON processor. This is the most portable approach and avoids dependency on external tools.

When you need to extract values for use in a follow-up terminal command (e.g., extracting IDs from a list to pass to an update), write a small inline script using the language runtime available in the user's environment. Python is widely available on both Linux/Mac and Windows:
```bash
fcli fod issue list --rel=<rel> --query "..." -o json | \
  python -c "import sys,json; print(','.join(str(i['vulnId']) for i in json.load(sys.stdin)))"
```
If `python` is not on PATH, try `python3`.

For simple field extraction without scripting, use fcli's built-in formats:
```bash
fcli fod issue list --rel=<rel> -o csv=vulnId                    # single field
fcli fod issue list --rel=<rel> -o expr='{vulnId},{category}\n'  # custom format
```

For full output format, `--query` SpEL syntax, null-safety patterns, and `--store` variable chaining, see `references/fcli-query-output.md`.

For available fcli fod modules and sub-commands, run `fcli fod -h` or see `references/fcli-fod-output-values.md`.


