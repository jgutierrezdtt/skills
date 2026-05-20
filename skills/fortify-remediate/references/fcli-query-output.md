# fcli Query and Output Reference

Detailed reference for `--query` (SpEL filtering), output formats, `--store` variable chaining,
and related fcli features. Applies to all fcli product modules (FoD, SSC, ScanCentral).

Source: https://fortify.github.io/fcli/latest/

---

## `--query` / `-q` — SpEL Filtering

Available on most `list` commands. Evaluates a Spring Expression Language (SpEL) expression
against each record and returns only matching records.

### Basic Operators

| Expression | Meaning |
|-----------|---------|
| `prop=='value'` | Equals |
| `prop!='value'` | Not equals |
| `prop>25` | Greater than (numeric) |
| `prop<25 \|\| prop>50` | OR condition |
| `p1=='v1' && p2=='v2'` | AND condition |
| `{'v1','v2'}.contains(prop)` | Set membership (multi-value OR) |
| `prop matches 'regex'` | Regex match (Java regex) |
| `prop matches '(?i)value'` | Case-insensitive regex |
| `prop matches 'val1\|val2'` | Regex OR |
| `p1=='v1' && (p2=='v2' \|\| p3=='v3')` | Grouped conditions |

### Examples

```bash
# FoD: critical issues
fcli fod issue list --rel=MyApp:main -q "severityString=='Critical'"

# FoD: new OR reopened issues
fcli fod issue list --rel=MyApp:main -q "{'New','Reopened'}.contains(status)"

# SSC: high priority issues introduced in the last 90 days
fcli ssc issue list --av=MyApp:main -q "friority=='High' && #date(foundDate) > #now('-90d')"

# FoD: releases with completed static scans
fcli fod release list -q "staticAnalysisStatusType=='Completed'"

# SSC: application versions committed and active
fcli ssc appversion list -q "committed==true && active==true"
```

### Shell Quoting

Enclose expressions in single quotes (bash) to prevent shell interpretation of `#`, `&&`, etc.
Use double quotes for SpEL string literals inside the single-quoted expression:

```bash
-q 'friority=="High"'                         # single outer, double inner
-q "{'Critical','High'}.contains(friority)"   # double outer, single inner
```

Use `#env('VARNAME')` to embed environment variable values without shell interpolation:

```bash
-q "#env('TARGET_SEVERITY')==severityString"
```

### Null Safety

`matches` throws an exception if the left operand is null. Guard with null checks:

```bash
# Include null records
-q 'prop==null || prop matches "val1|val2"'

# Exclude null records
-q 'prop!=null && prop matches "val1|val2"'

# Alternative that avoids the issue entirely
-q '{"val1","val2"}.contains(prop)'
```

For nullable nested properties:

```bash
# Top-level property existence check
-q '(has("property2") && property2=="value2")'

# Nested property
-q 'nestedObject!=null && nestedObject.has("stringValue") && nestedObject.stringValue=="v1"'
```

### Date / Time Utility Functions

Both sides of date comparisons must be explicit date objects:

| Function | Description |
|---------|-------------|
| `#date(prop)` | Convert field to date object |
| `#date('2024-01-01')` | Convert literal string to date object |
| `#now()` | Current date/time |
| `#now('-90d')` | Now minus 90 days |
| `#now('+15m')` | Now plus 15 minutes |

Period format: `+` or `-` followed by number and unit: `d`=days, `h`=hours, `m`=minutes, `s`=seconds.

```bash
# Issues introduced more than 90 days ago
-q '#date(introducedDate) < #now("-90d")'

# Issues introduced after a specific date
-q '#date(foundDate) > #date("2024-01-01")'
```

### Other Utility Functions

| Function | Description |
|---------|-------------|
| `#var('name')` | Access stored fcli variable |
| `#env('name')` | Access environment variable |

---

## Server-Side Filtering

fcli automatically converts certain `--query` expressions into server-side API filter parameters
to minimize data transferred. Auto-generated queries can be viewed by running with `--log-level DEBUG`.

### FoD — `--filters-param`

Auto-converted patterns:
- `prop1=='value'` — simple equality
- `prop1=='val1' || prop1=='val2'` — OR on a single property
- `{'value1','value2'}.contains(prop1)` — set membership
- `prop1 matches 'literalValue1|literalValue2'` — pipe-delimited OR
- AND combinations of the above

Override with `--filters-param` to pass a filter string directly to the FoD API:
```bash
fcli fod issue list --rel=MyApp:main --filters-param "severityString:Critical"
```

### SSC — `--q-param`

Auto-converted patterns:
- `prop1=='value'` — simple equality
- `prop1=='value' && prop2=='val2'` — AND of simple equality expressions

Override with `--q-param` to pass a query string directly to the SSC API:
```bash
fcli ssc issue list --av=MyApp:main --q-param "friority:Critical"
```

> **Caution:** `--q-param` values are passed verbatim to the SSC API and must be valid SSC server-side filter strings. Invalid values return HTTP 400. For example, `issueStatus:Unreviewed` is not a recognised SSC filter value and will fail. Prefer `--query` (SpEL, evaluated client-side) unless you have a specific reason to use server-side filtering.

---

## `-o` / `--output` — Output Formats

| Format | Description |
|--------|-------------|
| `-o json` | Full JSON — recommended for programmatic use |
| `-o table` | Human-readable table (predefined columns; may omit fields) |
| `-o csv` | CSV with all fields |
| `-o csv=field1,field2` | CSV with specific fields |
| `-o csv=id:ID,name:Name` | CSV with renamed headers |
| `-o xml` | XML output |
| `-o yaml` | YAML output |
| `-o expr='...'` | Custom text template per record |

**Discover available query fields** — use `--fetch=1` to retrieve a single record from the server without downloading the full list:

```bash
fcli fod issue list --rel=MyApp:main --fetch=1 -o json
fcli ssc issue list --av=MyApp:main --fetch=1 -o json
fcli ssc appversion list --fetch=1 -o json
```

`--fetch=<n>` is available on most `list` commands for FoD, SSC, and ScanCentral. Use `--fetch=5` for a small sample. This is significantly faster than downloading a full page and truncating locally.

**Custom expression format:**

```bash
# Extract specific values per record (note: \n for newline)
fcli fod issue list --rel=MyApp:main -o 'expr={id} {category} {severityString}\n'
fcli ssc appversion list -o 'expr={id} {application.name}:{name}\n'

# Generate a shell command per record
fcli ssc appversion list -q 'createdBy=="admin"' \
  -o 'expr=fcli ssc appversion delete {id}\n'
```

### `--style` Options

| Style element | Applies to | Effect |
|--------------|-----------|--------|
| `no-header` / `header` | csv, table | Toggle headers |
| `border` / `md-border` | table | Add borders |
| `pretty` / `no-pretty` | json, yaml, xml | Toggle pretty-printing |
| `flat` / `no-flat` | json, yaml, xml | Flatten nested objects |
| `array` | json, yaml | Wrap single output in array |

---

## `--store` — Variable Chaining

Store command output in an fcli variable for use in subsequent commands. Avoids shell JSON parsing.

### Storing a variable

```bash
# Store all properties from the result
fcli ssc appversion get MyApp:main --store myAV

# Store only specific properties — single colon, comma-separated property list
fcli fod release get MyApp:main --store myRel:releaseId,releaseName
```

### Referencing a stored variable

The reference syntax is **`::varName::propertyName`** — double colons on both sides:

```bash
# Reference a specific property
fcli ssc artifact upload -f scan.fpr --appversion ::myAV::id

# Reference the variable's default property (set by the storing command)
fcli ssc artifact upload -f scan.fpr --appversion ::myAV::
```

### Pass the reference as a separate argument

Variable references only resolve when the value is a separate command-line argument. Use the `--option value` form, not `--option=value`:

```bash
fcli ssc issue list --av ::myAV::id -o json     # resolves
fcli ssc issue list --av=::myAV::id -o json     # does NOT resolve — sent as literal
```

When you must use the `=` form (or the option doesn't accept the separate-argument form for any other reason), extract the value with a sub-shell instead:

```bash
fcli ssc issue list --av=$(fcli util variable contents myAV -o 'expr={id}') -o json
```

### Inspecting stored variables

```bash
fcli util variable list
fcli util variable contents myAV
fcli util variable contents myAV -o json -q 'id>1000'
```

### Chain scan start → wait-for pattern

```bash
# FoD
fcli fod sast-scan start --rel MyApp:main -f package.zip --store myScan
fcli fod sast-scan wait-for ::myScan::

# SSC (ScanCentral)
fcli sc-sast scan start -f package.zip --publish-to MyApp:main --store myScan
fcli sc-sast scan wait-for ::myScan::
```

---

## `--to-file` — File Output

Write command output to a file (status messages still appear on console):

```bash
fcli fod issue list --rel=MyApp:main -o json --to-file issues.json
fcli ssc appversion list -o csv --to-file appversions.csv
```

---

## Direct REST API Access

For operations not covered by named fcli commands, use the REST passthrough.

**FoD** (REST API base: `/api/v3/`):
```bash
fcli fod rest call -X GET /api/v3/<endpoint>
fcli fod rest call -X GET "/api/v3/<endpoint>?param=value"
fcli fod rest call -X POST /api/v3/<endpoint> -d '{"key":"value"}'
```

**SSC** (REST API base: `/api/v1/`):
```bash
fcli ssc rest call -X GET /api/v1/<endpoint>
fcli ssc rest call -X GET "/api/v1/<endpoint>?param=value"
```

### Sending a request body with `-d`

`-d` accepts either an inline string **or** a file reference. The file reference syntax is **`@@<path>`** (double at-sign) — this is fcli's own convention, not curl's single-`@`. Using `@<file>` will be sent as the literal string `@<file>` and the request will fail.

**Cross-platform-safe form** (works in bash on Linux/Mac, bash on Windows, cmd.exe, and PowerShell):

```bash
# Inline body
fcli ssc rest call -X POST /api/v1/<endpoint> -d "{\"key\":\"value\"}"

# Body from file — quote the whole value, use forward slashes in the path
fcli ssc rest call -X POST /api/v1/<endpoint> -d "@@./payload.json"
fcli ssc rest call -X PUT  /api/v1/<endpoint> -d "@@C:/Users/me/payload.json"
fcli fod rest call -X POST /api/v3/<endpoint> -d "@@/tmp/payload.json"
```

Why this form is portable:
- **Double quotes** work as quoting in cmd.exe (single quotes do not). They also work in bash and PowerShell.
- **Forward slashes** in the path work on all platforms — fcli/Java accepts them on Windows. This avoids the cmd.exe/PowerShell problem where `\` is interpreted as an escape inside quoted strings.
- The `@@` is part of the value sent to fcli, so it must be inside the quotes.

Consult the FoD OpenAPI spec (`fortify-fod/references/fod-openapi-spec.json`) or SSC Swagger UI
(`https://<ssc-host>/ssc/html/docs.html`) for available endpoints and parameters.
