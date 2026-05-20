## Creating a New Application in SSC
Use this reference during Step 2 of the application creation workflow when the platform is Fortify Application Security Center (SSC).

`fcli ssc appversion create` creates the app and the application version in one command, with the following fields:

| Flag | Purpose | Notes |
|------|---------|-------|
| `<app>:<version>` (positional) | Application and version name | Required |
| `--auto-required-attrs` | Auto-fill required attributes with defaults | Recommended |
| `--skip-if-exists` | Idempotent — no error if already exists | Recommended |
| `--issue-template=<id>` | Override the issue template | Optional; omit to use server default |
| `--attrs=ATTR=VALUE` | Set specific attribute values | Optional; Repeatable |
| `--active=true\|false` | Active (default) or inactive | Optional |
| `-d=<description>` | Version description | Optional |

Example app creation command:
```bash
fcli ssc appversion create "payments-api:main" \
  --auto-required-attrs \
  --skip-if-exists \
  -o json
```

---

### Required custom attributes

SSC tenants may require custom attributes. `--auto-required-attrs` fills them with defaults — the user should review values in the SSC UI afterward. If the `create` command fails with an attribute validation error, list available attribute definitions for an existing version to understand what's required:

```bash
fcli ssc appversion list --fetch=1
fcli ssc attr list --av="<existingAppVersion>" -o json
```

Attribute names are case-sensitive and must match the attribute definitions configured in SSC. To set specific attributes at creation time:

```bash
fcli ssc appversion create "payments-api:main" \
  --attrs "DevPhase=Development,BusinessRisk=High" \
  --auto-required-attrs \
  --skip-if-exists \
  -o json
```

---

### Verify successful app creation

```bash
fcli ssc appversion get "payments-api:main" -o json
```

> The version is ready to receive artifact uploads once `active==true` and `committed==true`. If `committed` is `false`, the version was created but not yet committed — this should not happen with `fcli ssc appversion create` under normal conditions, but check the create output for warnings and re-run the command if necessary.
