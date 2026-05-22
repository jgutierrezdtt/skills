## Use Case: Adding a Version to an Existing SSC Application

The user wants to add a new version within an existing SSC application — for
a new branch, environment, or release cycle.

> **Creating a new top-level application?** Use the `fortify-create-app` skill.
> This reference covers only versions within applications that already exist.

---

### Step 1 — Understand the existing application structure

If you need to resolve an existing application or version name for use as a
`--from` (copy source), load `references/resolving-appversion.md`.

List existing versions to understand naming patterns and identify a copy
source:

```bash
fcli ssc appversion list --query "application.name=='<appName>'" -o json
```

If a local git context is available, the branch name is a good starting point:

```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@'
```

---

### Step 2 — Create the new version

`fcli ssc appversion create` adds a version to an existing application. If the
application name in the positional argument doesn't exist it will be created —
but for new applications use the `fortify-onboard` skill instead.

**Add a version to an existing application:**

```bash
fcli ssc appversion create "SampleWebApp:my-feature-branch" \
  --auto-required-attrs \
  --skip-if-exists \
  -o json
```

**Key options:**

| Flag | Purpose | Notes |
|------|---------|-------|
| `<app>:<version>` (positional) | Application and version name | Required |
| `--auto-required-attrs` | Automatically set default values for required attributes | Recommended |
| `--skip-if-exists` | Idempotent — no error if the version already exists | Recommended |
| `--from=<appVersion>` | Copy state from an existing version | See below |
| `--copy=<options>` | What to copy: `custom-tags,bugtracker,processing-rules,attributes,users,state` | Default: all; only meaningful with `--from` |
| `--active=true\|false` | Active (default) or inactive version | Optional |
| `--issue-template=<id>` | Override the issue template | Optional |
| `--attrs=ATTR=VALUE` | Set attribute values | Repeatable |
| `--add-users=<user>` | Assign users to the version | Optional |
| `-d=<description>` | Version description | Optional |

---

### Copying from an existing version

Copying carries over audit decisions (custom tag values), filter sets, attributes, and configuration — recommended for new branches or environments.

```bash
fcli ssc appversion create "SampleWebApp:my-feature-branch" \
  --from="SampleWebApp:main" \
  --auto-required-attrs \
  --skip-if-exists \
  -o json
```

Restrict what's copied using `--copy`:

```bash
fcli ssc appversion create "SampleWebApp:my-feature-branch" \
  --from="SampleWebApp:main" \
  --copy=custom-tags,attributes \
  --auto-required-attrs \
  --skip-if-exists \
  -o json
```

> **Note on refresh:** When using `--from`, fcli refreshes the source version's metrics before copying (default timeout: 60 seconds). Use `--refresh-timeout=5m` to extend, or `--no-refresh` to skip.

---

### Setting attributes at creation time

```bash
fcli ssc appversion create "SampleWebApp:my-feature-branch" \
  --attrs "DevPhase=Development,BusinessRisk=High" \
  --auto-required-attrs \
  --skip-if-exists \
  -o json
```

Attribute names are case-sensitive. To list available attribute definitions:

```bash
fcli ssc attr list --av="<existingAppVersion>" -o json
```

---

### Step 3 — Confirm, then create

Before presenting the proposed command, verify:

- [ ] Application exists and versions listed to understand naming patterns
- [ ] `--from` (copy source) identified, or confirmed not applicable
- [ ] Required attributes assessed — `--auto-required-attrs` included or explicit values identified

Present the complete proposed command and summarize what will be created. Wait for explicit user confirmation before running any create commands.

---

### After creation

```bash
fcli ssc appversion get "SampleWebApp:my-feature-branch" -o json
# → check: committed==true, active==true
```

The version is ready to receive artifact uploads once `committed==true`.
