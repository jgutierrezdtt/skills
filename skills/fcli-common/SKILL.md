---
name: fcli-common
description: Generic reference for the Fortify CLI (fcli). Use when the user asks about installing or upgrading fcli, authenticating with fcli sessions (login/logout, named sessions, Personal Access Tokens), fcli environment variables, output formats, SpEL query syntax, variable chaining (--store), the fcli action framework, or creating/customizing fcli actions — especially when the question is not specific to a single product module. Also triggers for ScanCentral SAST/DAST infrastructure and observability questions (sensor management, pool configuration, controller setup, scan job status) that are not clearly scoped to SSC or FoD. Does NOT handle starting or running scans — use fortify-ssc or fortify-fod for scan initiation.
license: MIT
metadata:
  version: "1.0.0"
  tested-with:
    fcli: "3.18"
---

fcli (Fortify CLI) is the unified command-line interface for all Fortify products: Fortify on Demand (FoD), Software Security Center (SSC), ScanCentral SAST, and ScanCentral DAST.

Docs: https://fortify.github.io/fcli/latest/ | Source: https://github.com/fortify/fcli | Skill content reflects fcli v3.18.

This skill covers **cross-product fcli functionality**: installation, session management, output formatting, SpEL queries, variable chaining, custom action development, and ScanCentral operations. For product-specific operations (querying issues, managing scans, auditing vulnerabilities), defer to the `fortify-fod` or `fortify-ssc` skills — they provide deeper coverage of product-specific commands, API fields, and workflows.

## Top-Level Command Tree

| Module | Purpose |
|--------|---------|
| `fcli fod` | Fortify on Demand (SaaS) |
| `fcli ssc` | Software Security Center (on-premise) |
| `fcli sc-sast` | ScanCentral SAST scan management |
| `fcli sc-dast` | ScanCentral DAST scan management |
| `fcli action` | Cross-product automation actions |
| `fcli tool` | Install/manage fcli and other Fortify tools |
| `fcli config` | Proxy, trust store, public key settings |
| `fcli util` | Utilities (variables, command listing, etc.) |

Use `fcli --help` to list all top-level commands, and `fcli <module> -h` to drill down.

## Verifying Commands and Flags

**When uncertain whether a flag or subcommand exists, run `fcli <command> --help` before using it.** FCLI is fully self-documenting — every module, subcommand, and flag is discoverable at runtime. This is the authoritative source; do not invent flags or subcommands based on patterns from other CLIs.

```bash
fcli fod issue list --help    # verify available flags before constructing a command
fcli fod release --help       # list all release subcommands
fcli util all-commands list   # list every command available in the installed version
```

## Version Compatibility

These skills were developed and tested against specific product versions (see `tested-with` in each skill's frontmatter). Version mismatches are handled as follows:

- **Older fcli / SSC / FoD than tested-with**: A command, flag, REST endpoint, or feature may not exist yet. If a command fails with "unknown subcommand", "unrecognized option", or a 404/405 REST error, treat it as a likely version gap. Tell the user which versions the skill was tested with, which version they appear to be running (`fcli --version`), and recommend upgrading or consulting the changelog for their version.
- **Newer fcli / SSC / FoD than tested-with**: Backward compatibility is expected; proceed normally. The skill may simply be unaware of newer commands or options — use `fcli util all-commands list` or `--help` to discover them.
- **Unknown version**: If a command fails unexpectedly and the version is unknown, run `fcli --version` and, if relevant, ask the user for their SSC or FoD version before diagnosing further.

Do not silently retry a failed command with guessed syntax. Surface the version context to the user so they can make an informed decision.

## Installation & Upgrade

See `references/fcli-install.md` for full install and upgrade procedures. Summary:

**Quickest (requires Node.js/npx):**
```bash
# Linux/Mac
npx @fortify/setup env init --tools=fcli:auto
source <(npx @fortify/setup env shell)

# Windows PowerShell
npx @fortify/setup env init --tools=fcli:auto
npx @fortify/setup env powershell | Invoke-Expression
```

**Manual:** download the native binary for the target platform from https://github.com/fortify/fcli/releases and add to PATH. The managed install path defaults to `~/fortify/tools/bin`.

Do NOT silently download or execute anything without user confirmation.

Verify: `fcli --version`

## Session Management

Most fcli product modules require a login session before use:

```bash
fcli fod session login --url "https://api.ams.fortify.com" --user <user> --password <PAT> --tenant <tenantCode>
fcli ssc session login --url "https://my-ssc.com" --user <user> --password <pass>
```

**Best practices:**
- Always run `session logout` when finished (cleans up tokens server-side)
- Use **Personal Access Tokens** (FoD) or **CIToken / AutomationToken** (SSC) instead of passwords in automation — avoids temporary token creation
- Use **named sessions** (`--fod-session mySession`) to work with multiple instances simultaneously:
  ```bash
  fcli fod session login --fod-session prod ...
  fcli fod release list --fod-session prod
  ```
- In CI/CD pipelines, set `FCLI_STATE_DIR` per pipeline to prevent session collisions

Never output passwords or tokens in command output, logs, or chat messages. Use `--password` interactively or via environment variables.

Check session status:
```bash
fcli fod session ls --query "name=='default' && expired=='No'"
fcli ssc session ls --query "name=='default' && expired=='No'"
```

In CI/CD contexts where tokens may be revoked between runs, add `--validate` to confirm validity server-side rather than relying on the locally cached expiry date:
```bash
fcli fod session ls --validate    # FoD: hits server to check OAuth token is still valid
fcli ssc session ls --validate    # SSC: hits server and refreshes cached expiry/state
```

### Never bypass fcli for Fortify API access

All access to FoD and SSC must go through fcli. This is a strict, non-negotiable rule that applies to interactive use, scripts, and any code you write:

- **Never read fcli session or state files directly.** The fcli state directory (e.g., `~/.fortify/fcli/state`, `$FCLI_STATE_DIR`) holds session data. Do not open, parse, copy, decrypt, or transcribe its contents — and do not extract tokens, cookies, or credentials from it by any means.
- **Never call Fortify APIs with curl, wget, requests, Invoke-WebRequest, or any other HTTP client** as a way to bypass fcli. Doing so circumvents fcli's session handling, output transforms, safety rules, and the user's security boundary.
- **If fcli seems slow, optimize within fcli first.** Use server-side filtering / `--query`, persist intermediate results with `--store`, scope pagination with `--no-paging` only when intentional, or run multiple fcli invocations in parallel from the shell.
- **For endpoints not covered by a named fcli command, use `fcli fod rest call` or `fcli ssc rest call`.** That is the supported escape hatch — use it instead of an external HTTP client.
- **If fcli genuinely cannot do something or is unworkably slow, tell the user.** Do not work around it by extracting credentials or going around fcli.

## Output Formats

**Prefer `-o json` for programmatic work.** Parse JSON and summarize rather than relying on table output, which omits fields and truncates values.

| Format | Use case |
|--------|---------|
| `-o json` | Full field set — recommended for agents |
| `-o table` | Quick human-readable overview |
| `-o csv=field1,field2` | Specific field extraction |
| `-o expr='{f1},{f2}\n'` | Custom text format per record |

See `references/fcli-query-output.md` for full output format, `--style` options, and `-o expr` details.

## Filtering Quick Reference

`-q` / `--query` evaluates a SpEL expression per record. See `references/fcli-query-output.md` for full syntax and null-safety patterns.

```bash
# Equality
-q "name=='MyApp'"

# Multi-value match (preferred over || for sets)
-q "{'Critical','High'}.contains(severity)"

# Case-insensitive regex
-q "name matches '(?i).*payment.*'"

# Date comparison (both sides must be date objects)
-q "#date(creationDate) > #now('-90d')"
```

For advanced patterns (null safety, date comparisons, server-side filtering), see `references/fcli-query-output.md`.

## Variable Chaining (`--store`)

Store output from one command for use in the next, avoiding shell parsing of JSON:

```bash
fcli ssc appversion get MyApp:main --store myAV
fcli ssc artifact upload -f scan.fpr --appversion ::myAV::

fcli fod sast-scan start --rel MyApp:main -f pkg.zip --store myScan
fcli fod sast-scan wait-for ::myScan::
```

## Actions

Built-in actions automate common workflows (CI/CD pipeline runs, SARIF/GitHub/GitLab vulnerability export, policy checks, PR comments):

```bash
fcli fod action list               # list available FoD actions
fcli ssc action list               # list available SSC actions
fcli fod action help <action>      # view action usage/options
fcli fod action run <action> ...   # run an action
```

Documentation: https://fortify.github.io/fcli/latest/fod-actions.html and https://fortify.github.io/fcli/latest/ssc-actions.html

### Custom Action Development

Fcli actions are YAML files that define custom automation workflows. Use them to export vulnerabilities, enforce security policy, generate reports, or integrate with external systems.

See `references/fcli-custom-actions.md` for the full development workflow (scaffold, CLI options, step patterns, SpEL expressions, testing, signing).

To discover available commands for `run.fcli` steps, run `fcli util all-commands list` against the installed version. Add `-h` to any module or command to see its options and usage (e.g., `fcli fod -h` to list all FoD commands; `fcli fod release list -h` for help on a specific command).

## Environment Variables

| Variable | Purpose |
|---------|---------|
| `FCLI_DEFAULT_FOD_URL` | Default FoD URL for all fod commands |
| `FCLI_DEFAULT_SSC_URL` | Default SSC URL for all ssc commands |
| `FCLI_DEFAULT_<CMD>_<OPT>` | Default for any option — see docs |
| `FCLI_STATE_DIR` | Override fcli session/variable storage location |
| `HTTPS_PROXY` / `HTTP_PROXY` | Proxy for fcli network requests |
| `FCLI_ENCRYPT_KEY` | Custom encryption key for session data |

Command-prefixed defaults walk the command tree, e.g. `FCLI_DEFAULT_FOD_RELEASE_LIST_APP` sets the default `--app` for `fcli fod release list`.

## Reference Files

Load these **only when needed** for the specific task at hand:

| File | When to load |
|------|-------------|
| `references/fcli-install.md` | Installing, upgrading, or troubleshooting fcli setup |
| `references/fcli-query-output.md` | Complex queries, output format details, `--store` chaining |
| `references/fcli-custom-actions.md` | Creating or editing custom fcli action YAML files |
| `references/action-yaml-reference.md` | Full YAML instruction set or SpEL function reference |
