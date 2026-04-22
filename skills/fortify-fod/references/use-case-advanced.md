## Advanced: General API Queries and Fallback

### General API Queries (`fcli fod rest`)

For operations not covered by named fcli commands, use the REST passthrough. Always apply the Safety Rules from the main SKILL.md before any mutating call.

```bash
fcli fod rest call -X GET /api/v3/<endpoint>
fcli fod rest call -X GET "/api/v3/<endpoint>?param=value"
```

**Sending a request body with `-d`** — fcli uses `@@<path>` (double at-sign) for file references, **not** curl's single `@`. Use double quotes and forward slashes so the same command works in bash, cmd.exe, and PowerShell:

```bash
# Inline body (escape inner quotes for cmd.exe / PowerShell compatibility)
fcli fod rest call -X POST /api/v3/<endpoint> -d "{\"key\":\"value\"}"

# Body from a file — preferred for any non-trivial payload
fcli fod rest call -X POST /api/v3/<endpoint> -d "@@./payload.json"
fcli fod rest call -X PUT  /api/v3/<endpoint> -d "@@C:/Users/me/payload.json"
```

See `references/fcli-query-output.md` ("Sending a request body with `-d`") for the rationale and additional examples.

**Common REST patterns:**

```bash
# List users
fcli fod rest call -X GET /api/v3/users

# Get application owners (useful when creating apps)
fcli fod rest call -X GET /api/v3/applications/owners

# Get tenant entitlement info
fcli fod rest call -X GET /api/v3/tenant-entitlements

# Query policy pass/fail status for a release — use release data directly:
# isPassed, passFailReasonType, passFailReasonTypeId are included in release get/list output.
fcli fod release get "<AppName:ReleaseName>" -o json
# The /api/v3/releases/{id}/policy-details endpoint is not available (HTTP 404).
```

> **Note:** FoD's REST API uses `/api/v3/` as its base path. Pagination uses `offset` and `limit` query parameters (e.g., `?offset=0&limit=50`).

Consult `references/fod-openapi-spec.json` for endpoint paths, parameters, and response schemas. The spec is ~18K lines — load only the relevant section.

### Other fcli FoD Modules

Beyond the core modules covered in use case files, fcli supports additional FoD operations:

```bash
# Access control
fcli fod access-control list-users -o json
fcli fod access-control list-groups -o json
fcli fod access-control list-roles -o json

# Attributes
fcli fod attribute list -o json

# Microservices (for microservice-type apps)
fcli fod microservice list --app=<appNameOrId> -o json
```

### Fallback

If the user's request doesn't match any use case and no REST endpoint is obvious:
```bash
fcli fod -h
```

Explore sub-commands interactively to find the right command. You can drill further: `fcli fod <module> -h`.
