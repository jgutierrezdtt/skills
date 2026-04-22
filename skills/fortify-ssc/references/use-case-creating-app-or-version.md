## Use Case: Creating an Application or Version

The user wants to onboard a new project to SSC (new application + version) or add a new version to an existing application (new branch, new environment, new release).

---

### Step 1 — Understand the context and naming conventions

SSC applications and versions follow common structural patterns. Match the tenant's existing convention by inspecting what already exists:

```bash
fcli ssc app list -o json
```

If you need to resolve an existing application or version name for use as a `--from` (copy source), load `references/resolving-appversion.md` for the full resolution workflow.

Look for naming prefixes, separators, team tags, or BU identifiers in `name` values. Common patterns:

| Pattern | Application name | Version names |
|---------|-----------------|---------------|
| One app per repo (most common) | mirrors repo name (e.g., `payments-api`) | branches: `main`, `dev`, `my-feature-branch` |
| Versioned releases | product name | `v25.1`, `v25.2`, `v26.1` |
| Test environments | app name | `main`, `staging`, `qa` |
| Org-prefixed | `MyOrg/SampleWebApp` | `main`, `release-1.0` |

Check whether the target application already exists:
```bash
fcli ssc app list --query "name=='<appName>'" -o json
```

If the application exists, list its versions to understand naming patterns and identify a `--copy-from` source:
```bash
fcli ssc appversion list --query "application.name=='<appName>'" -o json
```

If a local git context is available, the default branch name is a good starting point for the first version:
```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
```

---

### Step 2 — Create the application version

`fcli ssc appversion create` creates both the application (if it doesn't exist) **and** the version in a single command. The application name is embedded in the `<app>:<version>` positional argument.

**Create a new application with its first version:**
```bash
fcli ssc appversion create "SampleWebApp:main" \
  --auto-required-attrs \
  --skip-if-exists \
  -o json
```

**Key options:**

| Flag | Purpose | Notes |
|------|---------|-------|
| `<app>:<version>` (positional) | Application and version name | Required |
| `--auto-required-attrs` | Automatically set default values for required attributes | Recommended to avoid validation failures |
| `--skip-if-exists` | Idempotent — no error if the version already exists | Recommended for CI/CD pipelines |
| `--from=<appVersion>` | Copy state from an existing version | See "Copying from an existing version" below |
| `--copy=<options>` | What to copy: `custom-tags,bugtracker,processing-rules,attributes,users,state` | Default: all; only meaningful with `--from` |
| `--active=true\|false` | Active (default) or inactive version | Optional |
| `--issue-template=<id>` | Override the issue template | Optional; defaults to the application's template |
| `--attrs=ATTR=VALUE` | Set attribute values (e.g., `DevPhase=Development`) | Repeatable |
| `--add-users=<user>` | Assign users to the version | Optional |
| `-d=<description>` | Version description | Optional |

---

### Copying from an existing version

Copying carries over audit decisions (custom tag values), filter sets, attributes, and configuration — giving the new version a head start based on a known-good source. This is recommended for new branches or environments.

```bash
# Create a new version for a feature branch, copying from main
fcli ssc appversion create "SampleWebApp:my-feature-branch" \
  --from="SampleWebApp:main" \
  --auto-required-attrs \
  --skip-if-exists \
  -o json
```

By default all copyable elements are included. Restrict what's copied using `--copy`:
```bash
# Copy only audit decisions (custom tags) and attributes, not users
fcli ssc appversion create "SampleWebApp:my-feature-branch" \
  --from="SampleWebApp:main" \
  --copy=custom-tags,attributes \
  --auto-required-attrs \
  --skip-if-exists \
  -o json
```

> **Note on refresh:** When using `--from`, fcli refreshes the source version's metrics by default before copying. For large applications this may time out (default: 60 seconds). Use `--refresh-timeout=5m` to extend, or `--no-refresh` to skip the refresh entirely.

---

### Setting attributes at creation time

To set specific attributes (business context, technical metadata) during creation:
```bash
fcli ssc appversion create "SampleWebApp:main" \
  --attrs "DevPhase=Development,BusinessRisk=High,InfoClassification=Internal" \
  --auto-required-attrs \
  --skip-if-exists \
  -o json
```

Attribute names are case-sensitive and must match the tenant's configured attribute definitions. To list available attribute definitions:
```bash
fcli ssc attr list --av="<existingAppVersion>" -o json
```

---

### Step 3 — Confirm, then create

Before presenting the proposed command to the user, verify:

- [ ] Tenant naming conventions inspected — `fcli ssc app list` reviewed for prefixes, separators, team tags
- [ ] Application existence checked — confirmed whether creating a new application or adding a version to an existing one
- [ ] `--from` (copy source) identified, or confirmed not applicable (first-ever scan, test environment with independent history)
- [ ] Required attributes assessed — `--auto-required-attrs` included or explicit values identified

Present the complete proposed command sequence and summarize what will be created. Wait for explicit user confirmation before running any create commands.

---

### After creation

Confirm the version was created and committed:
```bash
fcli ssc appversion get "SampleWebApp:main" -o json
# → check: committed==true, active==true
```

The version is ready to receive artifact uploads once `committed==true`.
