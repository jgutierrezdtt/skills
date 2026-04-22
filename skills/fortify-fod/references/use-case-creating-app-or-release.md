## Use Case: Creating an Application or Release

The user wants to onboard a new project to FoD (new app) or add a new release within an existing app (new branch, new version, new test environment, new microservice).

---

### Step 1 — Understand the context and naming conventions

FoD apps and releases follow common structural patterns. Match the tenant's existing convention:

| Pattern | App name | Release names |
|---------|----------|---------------|
| One app per repo (most common) | mirrors repo name (e.g., `payments-api`) | branches: `main`, `dev`, `my-feature-branch`, `pr-123` |
| Versioned deliverables | product name | `v25.1`, `v25.2`, `v26.1` |
| Test environments (DAST) | app name | `main`, `staging`, `qa` (each a separately deployed URL) |
| Microservices | app name with `--type=Microservice` | per-microservice releases; identifier: `AppName:ServiceName:ReleaseName` |

Some tenants enforce prefixes, suffixes, or separators (e.g., `team-payments/api`, `BU-Alpha:webapp`). Before naming a new app, inspect what already exists:
```bash
fcli fod app list -o json
```
Look for naming prefixes, separators, BU identifiers, or team tags in `applicationName` values.

Check whether the target app already exists and whether it uses microservices:
```bash
fcli fod app list --query "applicationName=='<name>'" -o json
# → check hasMicroservices field
```

If working with an existing app, list its releases (and microservices, if applicable) to understand naming patterns and identify the `--copy-from` source:
```bash
fcli fod release list --query "applicationName=='<name>'" -o json
fcli fod microservice list --app=<appNameOrId> -o json   # only if hasMicroservices==true
```

If a local git context is available, the default branch is a good `--copy-from` candidate:
```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
```

**Based on `hasMicroservices`, follow the appropriate path below.**

---

### Path A: Standard App (No Microservices)

#### Creating a new standard app

`fcli fod app create` creates the app and its first release in one command:

| Field | Flag | Required | Valid values |
|-------|------|----------|--------------|
| App name | `<applicationName>` (positional) | ✓ | free text |
| App type | `--type` | ✓ | `Web`, `ThickClient`, `Mobile` |
| Business criticality | `--criticality` | ✓ | `High`, `Medium`, `Low` |
| Initial release name | `--release` | ✓ | free text (e.g., `main`) |
| Initial release SDLC status | `--status` | ✓ | `Development`, `QA`, `Production`, `Retired` |
| Automatically set required attributes | `--auto-required-attrs` | Recommended | n/a |
| Make idempotent | `--skip-if-exists` | Recommended | n/a |

Optional but worth asking: `--owner` (app owner), `--description` (app description), `--release-description` (release description).  To get a list of possible app owners, query the API directly using `GET /api/v3/applications/owners`.

```bash
fcli fod app create "SampleWebApp" \
  --type=Web \
  --criticality=High \
  --release="main" \
  --status=Development \
  --auto-required-attrs \
  --skip-if-exists -o json
```

#### Adding a release to an existing standard app

To get a list of existing releases:

```bash
fcli fod release list --app=<appNameOrId> -o json
```

```bash
fcli fod release create "SampleWebApp:my-feature-branch" \
  --status=Development \
  --copy-from="SampleWebApp:main" \
  --auto-required-attrs \
  --skip-if-exists -o json

# Wait for copy to complete before any further operations
fcli fod release wait-for "SampleWebApp:my-feature-branch"
```

---

### Path B: Microservice App

A microservice-type app has an extra layer between the app and its releases. The full identifier for a release is `AppName:ServiceName:ReleaseName`.

#### Create a new microservice app (new apps only)
Create the microservices app with an initial microservice and release.

```bash
fcli fod app create "platform-services" \
  --type=Microservice \
  --criticality=High \
  --release="auth-service:main" \
  --status=Development \
  --auto-required-attrs \
  --skip-if-exists -o json
```

#### Adding new microservices to an existing microservices app

Each named service within the app is a separate microservice. Create one per service:

```bash
fcli fod microservice create "platform-services:payment-service" -o json
```

#### Adding new releases to a microservices app

Each microservice needs its own releases. The identifier format is `AppName:ServiceName:ReleaseName`.

To get a list of existing microservices and releases:

```bash
fcli fod microservice list --app=<appNameOrId> -o json
fcli fod release list --app=<appNameOrId> -o json
```

```bash
fcli fod release create "platform-services:payment-service:main" \
  --status=Development \
  --auto-required-attrs \
  --skip-if-exists -o json
```

For branch or version releases, use `--copy-from` to inherit audit decisions:


```bash
fcli fod release create "platform-services:auth-service:my-feature-branch" \
  --status=Development \
  --copy-from="platform-services:auth-service:main" \
  --auto-required-attrs \
  --skip-if-exists -o json

fcli fod release wait-for "platform-services:auth-service:my-feature-branch"
```

---

### `--copy-from` decision table

| Release type | `--copy-from` source |
|--------------|---------------------|
| Feature/PR branch | `main` of the same app (or microservice) |
| Version release (`v25.2`) | previous version (`v25.1`) |
| DAST environment (`staging`, `qa`) | omit — no prior audit history to inherit |

`--copy-from` copies audit decisions (auditor status, suppressions) from the source so previously-reviewed issues don't resurface as new. Use it almost always — omit only for truly independent releases with no prior scan history.

> ⚠️ After `--copy-from`, the new release enters a **suspended** state while copying. Do not attempt scans or other operations until `wait-for` completes.

---

### Step 2 — Check for required custom attributes

FoD tenants may require custom attributes beyond the standard fields. If unsure:
- Add `--auto-required-attrs` to auto-fill required attributes with defaults. Values may be inappropriate — the user should review in the FoD UI afterward.
- If `create` fails with an attribute error, list available attributes: `fcli fod attribute list -o json`

Ask the user if they know of any required attributes before running the command.

---

### Step 3 — Confirm, then create

Before presenting the proposed command to the user, verify:

- [ ] Tenant naming conventions inspected — `fcli fod app list` reviewed for prefixes, separators, team tags
- [ ] App existence checked — confirmed whether creating a new app or adding a release to an existing one
- [ ] `hasMicroservices` value known — correct path (A or B) selected
- [ ] `--copy-from` source identified, or confirmed not applicable (DAST environments, first-ever scan)
- [ ] Required attributes assessed — `--auto-required-attrs` included or explicit values identified

Present the complete proposed command sequence and summarize what will be created. Wait for explicit user confirmation (per Safety Rules in the main SKILL.md) before running any create commands.

---

### Managing Existing Microservices

Use these commands when the user wants to inspect, rename, or remove microservices on an existing app.

**List microservices:**
```bash
fcli fod microservice list --app=<appNameOrId> -o json
```

**Rename a microservice:**
```bash
fcli fod microservice update "platform-services:auth-service" -n="identity-service" -o json
```
Confirm with the user before running — this changes the identifier for all future commands referencing that microservice.

