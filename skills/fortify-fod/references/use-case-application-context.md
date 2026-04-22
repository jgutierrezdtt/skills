## Use Case: Application Context — Understanding a Specific App or Release

Use this for any task scoped to one application or a small number of named releases:
- Understanding details about a specific app or release
- Resolving app/release names to use in other commands (`--rel`)
- Comparing releases within the same app (e.g., `main` vs `dev`)
- Comparing one specific app/release against one other specific app/release

> For broad comparisons across many apps simultaneously, use the Portfolio Overview use case instead.

> **For open source component inventory or license risk within a specific app or release** — use the OSS Component Analysis use case (`references/use-case-oss-component-analysis.md`). Per-release OSS aggregate counts (`openSourceCritical`, etc.) are available in release data; go to the OSS use case for component-level details, CVE impact triage, and license filtering.

---

### Resolving App and Release Names

See `references/resolving-release.md` for the full resolution workflow — priority order, verification commands, and `--rel` identifier format. Apply that before any command in this use case that requires `--rel`.

---

### Getting Application and Release Details

**Get application details:**
```bash
# Exact name match
fcli fod app get "<appNameOrId>" -o json

# Search if name is uncertain
fcli fod app list --query "applicationName matches '(?i).*payments.*'" -o json
```

**Get release details** (includes per-scan-type counts and last scan dates):
```bash
fcli fod release get "<AppName:ReleaseName>" -o json
fcli fod release get "<AppName:MicroserviceName:RelName>" -o json   # with microservices
```

If the application uses microservices (`hasMicroservices==true` on the app), list them first:
```bash
fcli fod microservice list --app=<appNameOrId> -o json
```

Release identifier format:
- **Without microservices**: `AppName:ReleaseName`
- **With microservices**: `AppName:MicroserviceName:ReleaseName`

The separator defaults to `:` and can be changed with `--delim`.

---

### Comparing Releases or Microservices

Use this when the user wants to compare a specific set of releases — within the same app or between two named apps/releases. This is distinct from portfolio-level queries: you're working with named targets, not scanning the entire tenant.

**Compare issue counts at release level** (fast — uses precomputed fields, no issue-level queries needed):
```bash
# All releases for one app — compare aggregate metrics side by side
fcli fod release list --query "applicationName=='SampleWebApp'" -o json
# → compare critical, staticCritical, openSourceHigh, isPassed etc. across releases

# Two specific releases from different apps
fcli fod release get "AppOne:main" -o json
fcli fod release get "AppTwo:main" -o json
```

**Deduplicate issues across two releases** using `instanceId` (for "is this issue also in the other release?" questions):
```bash
# Fetch issue lists from two releases
fcli fod issue list --rel="SampleWebApp:main" -o json --to-file main-issues.json
fcli fod issue list --rel="SampleWebApp:dev"  -o json --to-file dev-issues.json
# Then compare instanceId sets to find issues present in one but not the other
python -c "
import json
main = {i['instanceId'] for i in json.load(open('main-issues.json'))}
dev  = {i['instanceId'] for i in json.load(open('dev-issues.json'))}
print('Only in main:', len(main - dev))
print('Only in dev:',  len(dev - main))
print('In both:',      len(main & dev))
"
```

`instanceId` is the stable cross-scan, cross-release identifier — do not use `id` for this.
