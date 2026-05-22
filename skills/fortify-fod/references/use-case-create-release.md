## Use Case: Adding a Release to an Existing FoD Application

The user wants to add a new release within an existing FoD application — for
a new branch, version, test environment, or microservice.

> **Creating a new top-level application?** Use the `fortify-create-app` skill.
> This reference covers only releases within apps that already exist.

---

### Step 1 — Understand the existing app structure

Check whether the app uses microservices:

```bash
fcli fod app list --query "applicationName=='<name>'" -o json
# → check hasMicroservices field
```

List existing releases (and microservices if applicable) to understand naming
patterns and identify a `--copy-from` source:

```bash
fcli fod release list --query "applicationName=='<name>'" -o json
fcli fod microservice list --app=<appNameOrId> -o json   # only if hasMicroservices==true
```

If a local git context is available, the branch name is a good starting point:

```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
```

**Based on `hasMicroservices`, follow Path A or B below.**

---

### Path A: Standard App (No Microservices)

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

- [ ] Application exists and `hasMicroservices` value known — correct path (A or B) selected
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

