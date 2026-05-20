## Creating a New Application in FoD
Use this reference during Step 2 of the application creation workflow when the platform is Fortify on Demand (FoD).

`fcli fod app create` creates the app and its first release in one command, with the following fields:

| Field | Flag | Required | Valid values | Notes |
|-------|------|----------|--------------|-------|
| App name | positional | ✓ | free text | Use name confirmed in previous phase |
| App type | `--type` | ✓ | `Web`, `ThickClient`, `Mobile`, `Microservice` | Default = `Web` |
| Business criticality | `--criticality` | ✓ | `High`, `Medium`, `Low` | Default = `Medium` |
| Initial release name | `--release` | ✓ | free text | Use name confirmed in previous phase |
| Initial release SDLC status | `--status` | ✓ | `Development`, `QA`, `Production`, `Retired` | Default = `Development` |
| Auto-fill required attributes | `--auto-required-attrs` | Recommended | n/a | Use by default
| Idempotent | `--skip-if-exists` | Recommended | n/a | Use by default |

> If user requests app type to be `Microservice`, the user must provide the microservice name. The release name should then be specified as `--release="<microservice>:<release>"`.

Optional fields: `--owner` (app owner), `--description`, `--release-description`.
To list possible owners: query `GET /api/v3/applications/owners` via the FoD
API.

Example app creation command:

```bash
fcli fod app create "payments-api" \
  --type=Web \
  --criticality=High \
  --release="main" \
  --status=Development \
  --auto-required-attrs \
  --skip-if-exists -o json
```

---

### Add additional microservices after app creation:**
If the user has requested to create a microservices app and has provided more than one micorserivce to create use the following command for each microservice:

```bash
fcli fod microservice create "platform-services:payment-service" -o json
```

Then add an initial release for each new microservice:

```bash
fcli fod release create "platform-services:payment-service:main" \
  --status=Development \
  --auto-required-attrs \
  --skip-if-exists -o json
```

---

### Required custom attributes
FoD tenants may require custom attributes beyond the standard fields `--auto-required-attrs` fills them with defaults — the user should review values in the FoD UI afterward. If the `create` command fails with an attribute error, list available attributes:

```bash
fcli fod attribute list -o json
```

---

### Verify successful app creation

```bash
fcli fod app list --query "applicationName=='payments-api'" -o json
```