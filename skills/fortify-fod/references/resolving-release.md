## Reference: Resolving App and Release Names (`--rel`)

Many `fcli fod` commands require a `--rel` argument identifying the target release. Use this reference whenever the release is not already explicit.

> **If the user already gave you a numeric release ID, stop here.** Use `--rel=<numericId>` directly (e.g., `--rel=1450004`). A numeric release ID is globally unique in FoD — no app name, app ID, or any other context is required alongside it. Skip all steps below.
>
> There is **no `--app` flag** on `fcli fod issue list` or similar commands. Do not add one. `--rel` is the only release identifier these commands accept.

---

### Priority Order for Resolving Names

1. **Explicit name in the user's message** — use it directly.
2. **Local git context** — if a workspace/repo is open, infer candidates:
   ```bash
   git remote get-url origin          # repo name often matches FoD app name
   git branch --show-current          # current branch often matches release name
   ```
   Strip hosting-provider prefixes/suffixes (e.g., `github.com/org/payments-api.git` → `payments-api`). Treat these as candidates, not certainties — confirm with a `list` query before using.
3. **Ask the user** — if neither yields a clear candidate, ask: "What is the FoD application name (or ID)? What release or branch are you interested in?"

Note: FoD app names sometimes follow organizational conventions that differ from repo names (e.g., prefixed with a team or BU name). If the `list` query finds no match, suggest the user check the FoD UI or provide the numeric app ID directly.

---

### Verifying the Release Exists

Always confirm the release exists before passing `--rel` to a downstream command:

```bash
# Verify by app name
fcli fod release list --query "applicationName=='SampleWebApp'" -o json

# Narrow to a specific release
fcli fod release list --query "applicationName=='SampleWebApp' && releaseName=='main'" -o json

# Fuzzy match if exact name is uncertain
fcli fod release list --query "applicationName matches '(?i).*payments.*'" -o json
```

If no release matches, report what was found and ask the user to confirm the correct app name, release name, or provide a numeric FoD release ID.

---

### `--rel` Identifier Format

`--rel` accepts:

| Format | Example |
|--------|---------|
| Numeric release ID | `--rel=1234` |
| `AppName:ReleaseName` | `--rel="MyApp:main"` |
| `AppName:MicroserviceName:ReleaseName` | `--rel="MyApp:auth-service:main"` |

Quote names containing spaces. Use `--delim` to change the `:` separator if names contain colons.

If the application uses microservices (`hasMicroservices==true` on the app record), list them first to find the correct microservice name:
```bash
fcli fod microservice list --app=<appNameOrId> -o json
```

Use `instanceId` — not `id` — as the canonical key for tracking issues across scans or releases.
