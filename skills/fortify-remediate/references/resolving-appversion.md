## Resolving Application Version for SSC (`--av`)

Many `fcli ssc` commands require an `--av` argument identifying the target application version. Use this reference whenever the version is not already explicit in the user's request.

> **If the user already gave you a numeric version ID, stop here.** Use `--av=<numericId>` directly (e.g., `--av=20001`). A numeric version ID is globally unique in SSC — no application name, application ID, or any other context is required alongside it. Skip all steps below.
>
> There is **no `--app` or `--version` flag** on `fcli ssc issue list` or similar commands. Do not add one. `--av` is the only version identifier these commands accept.

---

### Priority Order for Resolving Names

1. **Explicit name in the user's message** — use it directly.
2. **Local git context** — if a workspace/repo is open, infer candidates:
   ```bash
   git remote get-url origin          # repo name often matches SSC application name
   git branch --show-current          # current branch often matches version name
   ```
   Strip hosting-provider prefixes/suffixes (e.g., `github.com/org/payments-api.git` → `payments-api`). Treat these as candidates, not certainties — confirm with a `list` query before using.
3. **Ask the user** — if neither yields a clear candidate, ask: "What is the SSC application name (or ID)? What version or branch are you interested in?"

SSC application names sometimes follow organizational naming conventions (e.g., `MyOrg/payments-api`, `team-alpha:webapp`). If the `list` query finds no match, suggest the user check the SSC UI or provide the numeric version ID directly.

---

### Verifying the Version Exists

Always confirm the version exists before passing `--av` to a downstream command:

```bash
# Verify by application name (lists all versions for that app)
fcli ssc appversion list --query "application.name=='SampleWebApp'" -o json

# Narrow to a specific version
fcli ssc appversion list \
  --query "application.name=='SampleWebApp' && name=='main'" -o json

# Fuzzy match if exact application name is uncertain
fcli ssc appversion list \
  --query "application.name matches '(?i).*payments.*'" -o json

# Search applications directly if the version name is unknown
fcli ssc app list --query "name matches '(?i).*payments.*'" -o json
```

If no version matches, report what was found and ask the user to confirm the correct application name, version name, or provide a numeric version ID.

---

### `--av` Identifier Format

`--av` accepts:

| Format | Example |
|--------|---------|
| Numeric version ID | `--av=20001` |
| `AppName:VersionName` | `--av="SampleWebApp:main"` |

> **SSC names are case-sensitive.** `SampleWebApp:main` and `samplewebapp:main` are different identifiers.

Quote names containing spaces. To change the default `:` separator (e.g., when an application name contains a colon), use `--delim`:

```bash
fcli ssc appversion get "SampleWebApp/main" --av --delim=/ -o json
# or inline with the command
fcli ssc issue list --av="SampleWebApp/main" --delim=/ -o json
```

---

### Using the Numeric Version ID

When name resolution is ambiguous or when scripting for reliability, prefer the numeric version ID. Retrieve it once and reuse:

```bash
# Store the version ID for use in subsequent commands
fcli ssc appversion list \
  --query "application.name=='SampleWebApp' && name=='main'" \
  --store=av -o json

# Preferred: pass the stored variable as a separate argument (resolves ::av::id)
fcli ssc issue list    --av ::av::id -o json
fcli ssc artifact list --av ::av::id -o json

# Fallback: extract the id via a sub-shell when you need the '=' form
fcli ssc issue list --av=$(fcli util variable contents av -o 'expr={id}') -o json
```

> Variable references (`::av::id`) only resolve when passed as a separate argument — `--av ::av::id` works; `--av=::av::id` is sent as a literal string. Use the sub-shell fallback above when you need the `=` form. See `references/fcli-query-output.md` ("`--store` — Variable Chaining") for the full rules.

---

### Stable Issue Identity

Always use `issueInstanceId` (32-character hex string) as the canonical key for correlating the same issue across scans or versions. Do NOT use the numeric `id` field — it changes when issues are reprocessed and is not stable across version copies.
