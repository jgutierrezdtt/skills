## Advanced: General API Queries and Fallback

### General API Queries (`fcli ssc rest`)

For operations not covered by named fcli commands, use the REST passthrough. Always apply the Safety Rules from the main SKILL.md before any mutating call.

```bash
fcli ssc rest call -X GET /api/v1/<endpoint>
fcli ssc rest call -X GET "/api/v1/<endpoint>?param=value"
```

**Sending a request body with `-d`** — fcli uses `@@<path>` (double at-sign) for file references, **not** curl's single `@`. Use double quotes and forward slashes so the same command works in bash, cmd.exe, and PowerShell:

```bash
# Inline body (escape inner quotes for cmd.exe / PowerShell compatibility)
fcli ssc rest call -X POST /api/v1/<endpoint> -d "{\"key\":\"value\"}"

# Body from a file — preferred for any non-trivial payload
fcli ssc rest call -X POST /api/v1/<endpoint> -d "@@./payload.json"
fcli ssc rest call -X PUT  /api/v1/<endpoint> -d "@@C:/Users/me/payload.json"
```

See `references/fcli-query-output.md` ("Sending a request body with `-d`") for the rationale and additional examples.

Consult `references/ssc-openapi-spec.json` for endpoint paths, parameters, and response schemas. The spec is large — load only the relevant section. SSC's API version is `v1` (unlike FoD which uses `v3`).

**Common REST patterns:**

```bash
# Get a specific project version by ID
fcli ssc rest call -X GET /api/v1/projectVersions/20001

# List all project versions with pagination
fcli ssc rest call -X GET "/api/v1/projectVersions?start=0&limit=50"

# Get issues for a version
fcli ssc rest call -X GET "/api/v1/projectVersions/20001/issues?start=0&limit=200"

# Get reports
fcli ssc rest call -X GET /api/v1/reports
```

> **Note:** SSC's REST API uses the legacy term "projectVersions" for application versions, and "projects" for applications. These are the same as `appversion` and `app` in fcli.

### Other fcli SSC Modules

Beyond the core modules covered in use case files, fcli supports additional SSC operations:

```bash
# System state and job queue
fcli ssc system-state list-jobs -o json
fcli ssc system-state list-events -o json

# Alerts
fcli ssc alert list -o json

# Reports
fcli ssc report list -o json

# Plugin management
fcli ssc plugin list -o json

# Issue templates
fcli ssc issue-template list -o json

# Access control
# Note: access-control subcommands use hyphenated list- prefix, not "verb noun" style
fcli ssc access-control list-users -o json
fcli ssc access-control list-roles -o json
# Listing tokens requires explicit credentials (--user / --password):
fcli ssc access-control list-tokens --user=<username> --password=<password> -o json

# Issue groups (grouping issues by category, file, etc.)
fcli ssc issue list-groups --av="<AppName>:<VersionName>" -o json
```

### Fallback

If the user's request doesn't match any use case and no REST endpoint is obvious:
```bash
fcli ssc -h
```

Explore sub-commands interactively to find the right command. You can drill further: `fcli ssc <module> -h`.
