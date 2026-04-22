# Fcli Action YAML Reference

This is the complete reference for fcli action YAML instructions, types, and SpEL expression functions. Based on fcli v3.18.0, schema v2.7.0.

> **Schema URL:** `https://fortify.github.io/fcli/schemas/action/fcli-action-schema-2.7.0.json`
>
> **Official documentation:** https://fortify.github.io/fcli/latest/action-development.html

---

## Contents

- [Primary YAML Instructions](#primary-yaml-instructions) — `$schema`, `author`, `usage`, `config`, `cli.options`, `steps`, `formatters`, `functions`
- [Step Instructions](#step-instructions) — `var.set`, `fn.yield`, `sleep`, `rest.call`, `run.fcli`, `out.write`, `check`, `records.for-each`, `with` (sessions/writers/product), `writer.append`, `throw`, `exit`
- [Control Instructions](#control-instructions) — `if`, `on.fail`, `on.success`
- [SpEL Functions Reference](#spel-functions-reference) — CI detection, date/time, text, utility, introspection, Fortify-specific, workflow, encryption
- [Complete Example: SSC Vulnerability Export to CSV](#complete-example-ssc-vulnerability-export-to-csv)
- [Complete Example: FoD Policy Check](#complete-example-fod-policy-check)
- [Exploring Built-in Actions](#exploring-built-in-actions)

---

## Primary YAML Instructions

These are the top-level keys in an action YAML file.

### `$schema`
**Required** (unless declared via YAML comment). Defines the schema version.

```yaml
$schema: https://fortify.github.io/fcli/schemas/action/fcli-action-schema-2.7.0.json
```
Or as a YAML comment (preferred for VS Code + Red Hat YAML plugin):
```yaml
# yaml-language-server: $schema=https://fortify.github.io/fcli/schemas/action/fcli-action-schema-2.7.0.json
```

### `author`
**Required** string. Free-format author identifier.
```yaml
author: MyCompany
```

### `usage`
**Required** object with `header` (string) and `description` (expression/string).
```yaml
usage:
  header: Export vulnerabilities to SARIF format
  description: |
    Exports all vulnerabilities from the specified application version
    to a SARIF 2.1.0 file for import into GitHub Code Scanning.
```

### `config`
Optional object for action-level configuration.

| Property | Description |
|----------|-------------|
| `rest.target.default` | Default REST target for `rest.call` steps (`fod`, `ssc`, or custom target name) |
| `output` | (DEPRECATED) `delayed` or `immediate` |
| `mcp` | `include` (default) or `exclude` — whether action is available as MCP tool |
| `mask.env-vars` | Map of environment variable names to mask configurations |

```yaml
config:
  rest.target.default: ssc
```

### `cli.options`
Optional map of CLI options. Each key is the option identifier (referenced via `${cli.<key>}`).

| Property | Type | Description |
|----------|------|-------------|
| `names` | string | **Required.** Comma-separated option names (e.g., `-f, --file`) |
| `description` | string | **Required.** Help text |
| `type` | string | `string` (default), `boolean`, `int`, `long`, `double`, `float`, `array` |
| `default` | expression | Default value (supports SpEL, e.g., `${#env('MY_VAR')}`) |
| `required` | boolean | Default: `true` |
| `mask` | object | Log masking: `{sensitivity: high\|medium\|low}` |
| `group` | string | Group name for `#action.copyParametersFromGroup()` |
| `mcp` | enum | `include` (default) or `exclude` from MCP tool arguments |

### `steps`
**Required** list of step instructions. Each list item is a single instruction.

### `formatters`
Optional map of named formatters. Each formatter can be a string (plain text template) or a structured YAML object. Every string value is processed as a SpEL template expression.

```yaml
formatters:
  issueRecord:
    id: ${issue.id}
    severity: ${issue.severity}
    category: ${issue.category}
    url: ${#fod.issueBrowserUrl(issue)}
```

### `functions`
Optional map of reusable named functions. Each function can accept typed arguments, return a value, or stream records lazily using `fn.yield`. Functions are invoked from SpEL expressions via `#fn.call('name', arg1, arg2, ...)`.

```yaml
functions:
  # Simple function: returns a formatted string
  formatSeverity:
    args:
      issue: object
    return: string
    steps:
      - return: "${issue.severityString} [${issue.id}]"

  # Streaming function: yields records one by one
  criticalIssues:
    args:
      issues: object
    steps:
      - records.for-each:
          from: ${issues}
          record.var-name: issue
          do:
            - if: ${issue.severityString == 'Critical'}
              fn.yield: ${issue}
```

Invoke from steps:
```yaml
- var.set:
    label: ${#fn.call('formatSeverity', issue)}

- records.for-each:
    from: ${#fn.call('criticalIssues', allIssues)}
    record.var-name: issue
    do:
      - log.info: ${issue.category}
```

> **Note:** `functions` support was added in fcli v3.18.0. Verify exact argument type syntax against the current JSON schema before authoring.

---

## Step Instructions

### `fn.yield`
Emit a record from within a streaming `functions` definition. The framework automatically detects when the consumer has stopped reading and terminates iteration early. Only valid inside a `functions` entry.

```yaml
functions:
  filteredIssues:
    args:
      issues: object
      minSeverity: int
    steps:
      - records.for-each:
          from: ${issues}
          record.var-name: issue
          do:
            - if: ${issue.severity >= minSeverity}
              fn.yield: ${issue}
```

### `sleep`
Pause execution for a SpEL-evaluated duration in milliseconds.

```yaml
- sleep: 2000               # literal: pause 2 seconds
- sleep: ${cli.delay}       # from CLI option
- sleep: ${retryCount * 500}  # computed backoff
```

Useful for retry loops or rate-limiting workarounds. Prefer server-side filtering and `--fetch` over polling where possible.

### `var.set`
Set one or more variables. Variable names can use dot notation for properties or `..` for array append.

```yaml
- var.set:
    myVar: Hello ${name}           # Simple variable
    obj.prop1: value1              # Property on object
    arr..: new element             # Append to array
    formatted: {fmt: myFormatter}  # Use a formatter
    combined:                      # Formatter with input value
      fmt: myFormatter
      value: ${someData}
```

### `var.rm`
Remove variables.
```yaml
- var.rm:
    - myVar
    - ${dynamicVarName}
```

### `log.progress`
Write a progress message (may be overwritten by next progress message).
```yaml
- log.progress: "Processing record ${index} of ${total}"
```

### `log.info`
Write an informational message to console and log.
```yaml
- log.info: "Output written to ${cli.file}"
- log.info:
    msg: "Operation completed with warnings"
    cause: ${lastException}
```

### `log.warn`
Write a warning message.
```yaml
- log.warn: "Skipping record due to error: ${errorMsg}"
```

### `log.debug`
Write a debug message (log file only).
```yaml
- log.debug: ${#this}  # Log all action variables
```

### `rest.target`
Define custom REST targets for use in `rest.call` steps.
```yaml
- rest.target:
    myApi:
      baseUrl: https://api.example.com/v1
      headers:
        Authorization: Bearer ${#env('API_TOKEN')}
```

Built-in targets (no setup needed): `fod`, `ssc`, `sc-sast`, `sc-dast`.

### `rest.call`
Execute one or more REST calls. Each map entry is a named call.

| Property | Description |
|----------|-------------|
| `target` | REST target name (required if no default configured) |
| `method` | HTTP method (default: `GET`) |
| `uri` | **Required.** URI path (SpEL expression) |
| `query` | Map of query parameters |
| `body` | Request body (SpEL expression) |
| `type` | `simple` (default) or `paged` (auto-pages through results) |
| `log.progress` | Progress logging during paging |
| `records.for-each` | Process each response record |

Response variables (for call named `x`):
- `x` — processed response
- `x_raw` — raw unprocessed response
- `x_exception` — Java Exception if request failed

These variables are local to the `rest.call` map entry (use `var.set` in `on.success` to persist).

```yaml
- rest.call:
    pvs:
      target: ssc
      uri: /api/v1/projectVersions
      query:
        fields: id,name,project
      type: paged
      log.progress:
        page.post-process: "Processed ${totalIssueCount?:0} records"
      records.for-each:
        record.var-name: pv
        embed:
          artifacts:
            uri: /api/v1/projectVersions/${pv.id}/artifacts
        do:
          - log.info: "Version: ${pv.name}, Artifacts: ${pv.artifacts.size()}"
```

### `run.fcli`
Execute fcli commands. Each map entry is a named invocation.

Can be specified as a simple string or structured object:
```yaml
# Simple form
- run.fcli:
    listVersions: fcli ssc av ls

# Structured form
- run.fcli:
    getVersion:
      cmd: ssc appversion get ${cli.appversion} --embed=attrValuesByName
      records.collect: true
      stdout: suppress
```

| Property | Description |
|----------|-------------|
| `cmd` | **Required.** Fcli command (with or without `fcli` prefix) |
| `stdout` | `suppress`, `collect`, or `show` (default depends on context) |
| `stderr` | `suppress`, `collect`, or `show` (default: `show`) |
| `records.collect` | If `true`, records are accessible via `<name>.records` |
| `records.for-each` | Process each output record |

Output variables (for invocation named `x`):
- `x.records` — array of records (if `records.collect: true`)
- `x.stdout` — stdout output (if `stdout: collect`)
- `x.stderr` — stderr output (if `stderr: collect`)
- `x.exitCode` — exit code
- `x.metadata` — paging and response metadata from the command (e.g., total record count, page info); always emitted when available regardless of other settings

### `out.write`
Write data to files, stdout, or stderr.
```yaml
- out.write:
    ${cli.file}: ${#jsonStringify(results, true)}
    stdout: "Summary: ${totalCount} issues found"
```

### `check`
Define pass/fail checks (commonly used for security policy). Returns non-zero exit code if any check fails.

| Property | Description |
|----------|-------------|
| `display-name` | Display name for check output |
| `passIf` / `failIf` | **One required.** SpEL expression evaluating to true/false |
| `ifSkipped` | Result if check is skipped: `FAIL`, `PASS`, `SKIP`, `HIDE` |

Check status is accessible via `${checkStatus.checkName}`.

```yaml
- check:
    CRITICAL_ISSUES:
      display-name: "No critical vulnerabilities"
      failIf: ${criticalCount > 0}
      ifSkipped: PASS
    HIGH_ISSUES:
      display-name: "High vulnerabilities under threshold"
      passIf: ${highCount <= cli.maxHigh}
      ifSkipped: PASS
```

### `records.for-each`
Iterate over a collection.

```yaml
- records.for-each:
    from: ${myCollection}
    record.var-name: item
    breakIf: ${item.done}
    do:
      - log.info: ${item.name}
```

### `with`
Run steps within a context of sessions and/or writers.

#### With sessions:
```yaml
- with:
    sessions:
      - login: fcli fod session login --url ${fodUrl} --tenant ${tenant} --user ${user} --password ${password} --fod-session=mySession
        logout: fcli fod session logout --fod-session=mySession
  do:
    - run.fcli:
        cmd: fod release ls --fod-session=mySession
```

#### With product context:
Establish SSC or FoD product context within action steps, making product-specific SpEL functions (`#ssc.*`, `#fod.*`) and REST targets available without requiring a `with.sessions` block. Useful when the session is managed externally (e.g., already logged in) or when writing cross-product actions.

```yaml
- with:
    product: ssc
  do:
    - var.set:
        av: ${#ssc.appVersion(cli.appversion)}
    - rest.call:
        issues:
          uri: /api/v1/projectVersions/${av.id}/issues
          type: paged
          records.for-each:
            record.var-name: issue
            do:
              - log.info: ${#ssc.issueBrowserUrl(issue, fs)}
```

Valid values: `fod`, `ssc`.

> **Note:** `with.product` context was added in fcli v3.18.0. Verify exact syntax against the current JSON schema if issues arise.

#### With writers:
Writer types: `csv`, `table`, `expr`, `json`, `xml`, `yaml`.

```yaml
- with:
    writers:
      csvOut:
        to: ${cli.file}
        type: csv
  do:
    - records.for-each:
        from: ${allRecords}
        record.var-name: rec
        do:
          - writer.append:
              csvOut:
                id: ${rec.id}
                name: ${rec.name}
```

Writer destinations (`to`): file path, `stdout`, `stderr`, or `var:varName`.

### `writer.append`
Append data to a writer defined in a `with:writers` block.

### `do`
Group multiple steps (useful for conditional execution of a block).
```yaml
- if: ${condition}
  do:
    - log.info: Step 1
    - log.info: Step 2
```

### `throw`
Terminate action with an error.
```yaml
- throw: "ERROR: ${errorMessage}"
- throw:
    msg: "Operation failed"
    cause: ${lastException}
```

### `exit`
Terminate action with a specific exit code.
```yaml
- if: ${someCondition}
  exit: 1
```

---

## Control Instructions

These are combined with step instructions, not standalone.

### `if`
Conditional execution. SpEL expression must evaluate to `true` or `false`.
```yaml
- if: ${cli.include-fixed == true}
  rest.call: ...
```

### `on.fail`
Error handling. If not specified, exceptions propagate (fail-fast).
Available variables in `on.fail`:
- `lastException.type` — Java simple class name
- `lastException.message` — exception message  
- `lastException.pojo` — Java exception object

```yaml
- rest.call:
    myCall:
      uri: /api/v1/endpoint
      on.fail:
        - log.warn: "Call failed: ${lastException.message}"
```

### `on.success`
Steps to execute on success.

---

## SpEL Functions Reference

### CI Detection
| Function | Returns |
|----------|---------|
| `#_ci.detect()` | CI-specific object with `type` and `env` properties |
| `#github.env` | GitHub Actions environment data |
| `#gitlab.env` | GitLab CI environment data |
| `#ado.env` | Azure DevOps environment data |
| `#bitbucket.env` | Bitbucket Pipelines environment data |

### CI Integration
| Function | Description |
|----------|-------------|
| `#github.repo().uploadSarif(sarif)` | Upload SARIF to GitHub Code Scanning |
| `#github.repo().createCheckRun(body)` | Create GitHub check run with annotations |
| `#github.repo().addPrComment(body)` | Add PR comment |
| `#gitlab.project().uploadSecurityReport(type, content)` | Upload to GitLab security dashboard |
| `#gitlab.project().uploadCodeQualityReport(content)` | Upload GitLab code quality report |
| `#ado.repo().uploadSarif(sarif)` | Upload SARIF to ADO Advanced Security |
| `#bitbucket.repo().uploadReport(id, content)` | Upload Bitbucket Code Insights report |

### Date/Time
| Function | Description |
|----------|-------------|
| `#currentDateTime()` | Current date/time as `yyyy-MM-dd HH:mm:ss` |
| `#now()` | Current date/time as OffsetDateTime |
| `#now(period)` | Current date/time adjusted (e.g., `#now('-90d')`) |
| `#date(input)` | Parse string to OffsetDateTime |
| `#formatDateTime(fmt[, input])` | Format date/time with pattern |

### Text Manipulation
| Function | Description |
|----------|-------------|
| `#abbreviate(input, maxLength)` | Truncate with ellipsis |
| `#fmt(format, args)` | Java String.format |
| `#htmlToText(html)` | Convert HTML to plain text |
| `#htmlToSingleLineText(html)` | Convert HTML to single-line text |
| `#ifBlank(input, default)` | Return default if blank |
| `#isBlank(input)` | True if null or blank |
| `#isNotBlank(input)` | True if not null/blank |
| `#indent(input, prefix)` | Indent each line |
| `#join(delimiter, array)` | Join array elements |
| `#joinOrNull(delimiter, array)` | Join or null if any element is null |
| `#numberedList(array)` | Generate numbered list |
| `#substringAfter(input, separator)` | Substring after separator |
| `#substringBefore(input, separator)` | Substring before separator |
| `#regexQuote(input)` | Escape regex special characters |
| `#repeat(input, count)` | Repeat text N times |
### Introspection
Query the installed fcli's command structure at runtime. Useful for defensive actions that need to check whether a command or flag exists before using it, or to enumerate available commands dynamically.

| Function | Description |
|----------|-----------|
| `#fcli.listCommands()` | List all commands available in the installed fcli |
| `#fcli.listCommands(query)` | List commands matching a SpEL query expression |
| `#fcli.getCommandSpec(command)` | Get full spec (options, args, description) for a command |
| `#fcli.getCommandArgs(command)` | Get the argument definitions for a command |

```yaml
# Check whether a flag exists before using it
- var.set:
    spec: ${#fcli.getCommandSpec('fod issue list')}
- if: ${spec.options.contains('--fetch')}
  run.fcli:
    issues: fod issue list --rel=${cli.release} --fetch=1 -o json
```
### Utility
| Function | Description |
|----------|-------------|
| `#env(name)` | Get environment variable value |
| `#uuid()` | Generate random UUID |
| `#jsonStringify(input[, pretty])` | Convert to JSON string |
| `#properties(input)` | Convert object to key-value pair array |
| `#resolveAgainstCurrentWorkDir(path)` | Resolve path against CWD |
| `#uriPart(uri, part)` | Extract URI part (host, path, query, etc.) |
| `#fs.exists(path)` | Check if file/directory exists |
| `#fs.isFile(path)` | Check if path is a file |
| `#fs.isReadableFile(path)` | Check if file is readable |
| `#fs.isWritableDir(path)` | Check if directory is writable |

### Fortify-Specific
| Function | Description |
|----------|-------------|
| `#fod.release(nameOrId)` | Load FoD release object |
| `#fod.releaseBrowserUrl(rel)` | Browser URL for FoD release |
| `#fod.issueBrowserUrl(issue)` | Browser URL for FoD issue |
| `#fod.appBrowserUrl(rel)` | Browser URL for FoD application |
| `#ssc.appVersion(nameOrId)` | Load SSC application version |
| `#ssc.appversionBrowserUrl(av, fs)` | Browser URL for SSC app version |
| `#ssc.issueBrowserUrl(issue, fs)` | Browser URL for SSC issue |
| `#ssc.filterSet(av, titleOrId)` | Load SSC filter set |
| `#ssc.ruleDescriptionsProcessor(avId)` | Iterator for rule descriptions |
| `#cleanIssueDescription(desc)` | Clean issue description to plain text |
| `#cleanRuleDescription(desc)` | Clean rule description to plain text |
| `#issueSourceFileResolver(config)` | Map Fortify paths to workspace paths |

### Workflow
| Function | Description |
|----------|-------------|
| `#action.runID()` | Current fcli run UUID |
| `#action.copyParametersFromGroup(group)` | Copy CLI options from group |
| `#opt(name, value)` | Format option if value not blank |
| `#check(throwError, msg)` | Throw error if condition is true |
| `#var(name)` | Retrieve stored fcli variable |

### Encryption
| Function | Description |
|----------|-------------|
| `#encrypt(input)` | Encrypt string |
| `#decrypt(input)` | Decrypt string |

---

## Complete Example: SSC Vulnerability Export to CSV

```yaml
# yaml-language-server: $schema=https://fortify.github.io/fcli/schemas/action/fcli-action-schema-2.7.0.json

author: MyCompany

usage:
  header: Export SSC vulnerabilities to CSV
  description: |
    Exports all vulnerabilities from the specified SSC application version
    to a CSV file. Supports filtering by minimum severity.

config:
  rest.target.default: ssc

cli.options:
  appversion:
    names: --appversion, --av
    description: "SSC application version id or <app>:<version>"
    required: true
  file:
    names: -f, --file
    description: Output CSV file path
    required: false
    default: vulnerabilities.csv
  min-severity:
    names: --min-severity
    description: "Minimum severity to include (1=Low, 2=Medium, 3=High, 4=Critical)"
    type: int
    required: false
    default: 1

steps:
  # Load application version details
  - var.set:
      av: ${#ssc.appVersion(cli.appversion)}
      fs: ${#ssc.filterSet(#ssc.appVersion(cli.appversion), '')}
      issueCount: 0

  - log.info: "Exporting vulnerabilities for ${av.project.name}:${av.name}"

  # Write CSV output using a writer
  - with:
      writers:
        csv:
          to: ${cli.file}
          type: csv
    do:
      - rest.call:
          issues:
            uri: /api/v1/projectVersions/${av.id}/issues
            query:
              filter: friority:Critical|High|Medium|Low
              fields: id,issueName,friority,primaryLocation,lineNumber,fullFileName,issueInstanceId,engineType
            type: paged
            log.progress:
              page.post-process: "Exported ${issueCount} issues"
            records.for-each:
              record.var-name: issue
              do:
                - if: ${issue.friority == 'Critical' ? 4 : issue.friority == 'High' ? 3 : issue.friority == 'Medium' ? 2 : 1 >= cli.min-severity}
                  do:
                    - writer.append:
                        csv:
                          ID: ${issue.id}
                          Issue: ${issue.issueName}
                          Severity: ${issue.friority}
                          File: ${issue.fullFileName}
                          Line: ${issue.lineNumber}
                          URL: ${#ssc.issueBrowserUrl(issue, fs)}
                    - var.set:
                        issueCount: ${issueCount + 1}

  - log.info: "Exported ${issueCount} vulnerabilities to ${cli.file}"
```

**Run it:**
```bash
fcli ssc action run my-vuln-export.yaml --appversion "MyApp:main" --file vulns.csv --min-severity 3
```

---

## Complete Example: FoD Policy Check

```yaml
# yaml-language-server: $schema=https://fortify.github.io/fcli/schemas/action/fcli-action-schema-2.7.0.json

author: MyCompany

usage:
  header: Check FoD release against security policy
  description: |
    Evaluates the specified FoD release against security policy criteria.
    Returns a non-zero exit code if any check fails.

config:
  rest.target.default: fod

cli.options:
  release:
    names: --release, --rel
    description: "FoD release id or <app>:<release>"
    required: true

steps:
  - var.set:
      rel: ${#fod.release(cli.release)}

  - log.info: "Checking policy for ${rel.applicationName}:${rel.releaseName}"

  # Get issue counts by severity
  - rest.call:
      summary:
        uri: /api/v3/releases/${rel.releaseId}/vulnerability-summary
        on.success:
          - var.set:
              criticalCount: ${summary.criticalCount?:0}
              highCount: ${summary.highCount?:0}

  # Define policy checks
  - check:
      NO_CRITICALS:
        display-name: "No critical vulnerabilities"
        failIf: ${criticalCount > 0}
        ifSkipped: PASS
      HIGH_THRESHOLD:
        display-name: "High vulnerabilities under 10"
        failIf: ${highCount > 10}
        ifSkipped: PASS

  - log.info: "Policy check complete. Critical: ${criticalCount}, High: ${highCount}"
```

---

## Exploring Built-in Actions

The best way to learn action patterns is to read existing built-in actions:

```bash
# List all available actions
fcli fod action list
fcli ssc action list

# View source of a specific action
fcli fod action get sarif-sast-report
fcli ssc action get check-policy

# Browse online
# FoD: https://github.com/fortify/fcli/tree/v3.16.0/fcli-core/fcli-fod/src/main/resources/com/fortify/cli/fod/actions/zip
# SSC: https://github.com/fortify/fcli/tree/v3.16.0/fcli-core/fcli-ssc/src/main/resources/com/fortify/cli/ssc/actions/zip
# Shared: https://github.com/fortify/fcli/tree/v3.16.0/fcli-core/fcli-common/src/main/resources/com/fortify/cli/common/actions/zip
```
