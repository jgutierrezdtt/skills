## Use Case: Importing Scan Results (ASPM / Single Pane of Glass)

The user wants to import existing scan results into FoD from an on-premises Fortify scan, a third-party SAST tool, or a third-party SCA/SBOM tool. This is the core AppSec Posture Management (ASPM) workflow — consolidating results from multiple scanning tools and pipelines into FoD as a central reporting platform.

**Supported import sources:**

| Source | Format | Command |
|--------|--------|---------|
| On-prem Fortify SAST (ScanCentral, Fortify SCA) | FPR file | `fcli fod sast-scan import` |
| Third-party SAST tool | SARIF file | `fcli fod sast-scan import-sarif` |
| On-prem Fortify DAST (WebInspect) | FPR file | `fcli fod dast-scan import` |
| Third-party SCA / SBOM | CycloneDX JSON or XML | `fcli fod oss-scan import` |

> **Important:** FoD does not return a scan ID for imported scans. The output of these commands cannot be used with `fcli fod *-scan wait-for` or any command that expects a scan ID. Imports are fire-and-forget — FoD processes them asynchronously.

---

### Step 1 — Identify the target release

You need the release identifier (`--rel`) before importing. If it isn't already explicit, load `references/resolving-release.md` for the full resolution workflow.

```bash
# Confirm the release exists and get its ID
fcli fod release list --query "applicationName=='<appName>' && releaseName=='<releaseName>'" -o json
```

If the release doesn't exist yet, create it first. Load `references/use-case-creating-app-or-release.md`.

---

### Step 1 → Step 3 gate

Before running any import command, confirm:

- [ ] Target release exists and `--rel` identifier is confirmed
- [ ] Branch/release alignment verified (Step 2) — mismatch acknowledged or confirmed intentional
- [ ] Correct import command selected for the source format (FPR → `sast-scan import` / `dast-scan import`; SARIF → `sast-scan import-sarif`; CycloneDX → `oss-scan import`)
- [ ] Source file path verified to exist locally
- [ ] User has confirmed this is the correct target release

Do NOT run any import command until the user has confirmed the target release and source file.

---

### Step 2 — Verify Branch/Release Alignment

Run all commands below **before** prompting the user — collect all alignment information in one pass, then surface any issues in a single confirmation.

**Collect alignment data (run silently)**

```bash
# Current branch
git branch --show-current

# All releases for this app — compare names against the branch list
fcli fod release list --query "applicationName=='<appName>'" \
  -o table --columns releaseName,releaseId,sdlcStatusType,isPassed

# All local/remote branches — compare against the release list
git branch -a --format='%(refname:short)' | sed 's|^origin/||' | sort -u
```

**Evaluate findings**

| Finding | Treatment |
|---------|-----------|
| Release resolved from a user-supplied numeric ID | ✅ Skip all checks — explicit choice made. Proceed to Step 3. |
| `git branch` returned empty (detached HEAD / no git context) | ✅ No comparison possible. Proceed to Step 3. |
| Current branch **exactly matches** the resolved release name | ✅ Aligned. Proceed to Step 3. |
| Current branch **does not match** the resolved release name | ⚠️ Include in prompt |
| Another FoD release exists whose name matches the current branch | ⚠️ Include in prompt |
| Other git branches match other FoD release names (not the resolved target) | ℹ️ Mention alongside the prompt if one is required; otherwise note briefly when presenting Step 3 |

**Prompt the user (at most once)**

If all findings are ✅, proceed to Step 3 without prompting.

If any ⚠️ findings exist, send **one** message covering all of them:

> ⚠️ **Release alignment — please confirm before proceeding**
>
> - Current git branch: **`<currentBranch>`**
> - Target FoD release: **`<resolvedReleaseName>`**
> - [if names differ] These do not match. If you meant to import results for `<currentBranch>`, a dedicated FoD release may need to be created first.
> - [if a release named `<currentBranch>` already exists in FoD] A release named `<currentBranch>` already exists (ID: `<id>`). Did you mean to import into that one?
> - [if other branch/release overlaps] Other branches with matching FoD releases: `<list>`
>
> How would you like to proceed?
> - **Continue** — import into the `<resolvedReleaseName>` release as originally resolved
> - **Switch** — switch to the `<currentBranch>` release (ID: `<id>`)
> - **Create** — create a new `<currentBranch>` release first (I'll handle it using `use-case-create-release.md`)
> - **Cancel** — stop here so you can manually correct the target release

Wait for the user's single reply, then act on it. Do **not** ask follow-up alignment questions.

---

### Step 3 — Import the scan results

**Import SAST results from an FPR file** (on-prem Fortify SAST / ScanCentral SAST output):
```bash
fcli fod sast-scan import --rel=<app>:<release> -f=<path/to/results.fpr>
```

**Import SAST results from a SARIF file** (third-party SAST tools such as CodeQL, Semgrep, Checkmarx, etc.):
```bash
fcli fod sast-scan import-sarif --rel=<app>:<release> -f=<path/to/results.sarif>
```

**Import DAST results from an FPR file** (on-prem WebInspect or ScanCentral DAST output):
```bash
fcli fod dast-scan import --rel=<app>:<release> -f=<path/to/results.fpr>
```

**Import OSS/SCA results from a CycloneDX SBOM** (third-party SCA tools such as Syft, cdxgen, Dependency-Track, OWASP Dependency-Check, etc.):
```bash
fcli fod oss-scan import --rel=<app>:<release> -f=<path/to/sbom.json>
# CycloneDX is the default and only supported type; --type=CycloneDX is implicit
# Both JSON and XML CycloneDX formats are accepted
```

#### Using a microservice release
If the application uses microservices, use the three-part identifier:
```bash
fcli fod sast-scan import --rel=<app>:<microservice>:<release> -f=<path/to/results.fpr>
```

#### Using a release ID instead of name
```bash
fcli fod sast-scan import --rel=<releaseId> -f=<path/to/results.fpr>
```

---

### Step 4 — Verify the import

After import, check the release's scan state to confirm results were ingested:
```bash
# The *-scan get commands require a scan ID, not --rel.
# Get the current scan ID from the release data, then retrieve scan details:
fcli fod release get "<app>:<release>" -o json
# → fields: currentStaticScanId, currentDynamicScanId, staticAnalysisStatusType, staticScanDate, issueCount

fcli fod sast-scan get <currentStaticScanId> -o json   # for SAST imports
fcli fod dast-scan get <currentDynamicScanId> -o json  # for DAST imports
```

Look for a recent `staticScanDate` / `dynamicScanDate` and non-zero issue counts. Processing may take a few minutes after import.

---

### Notes and constraints

- **No wait-for support:** Unlike scans started through FoD's own scan engine, imported scans do not return a scan ID. There is no way to programmatically poll or wait for import completion via fcli.
- **Chunk size:** For large files, you can increase the upload chunk size. The default is 1 MB (1048576 bytes). Larger chunks may improve upload speed on high-bandwidth connections:
  ```bash
  fcli fod sast-scan import --rel=<app>:<release> -f=results.fpr --chunk-size=5242880
  ```
- **File type matters:** `sast-scan import` and `dast-scan import` both accept FPR files only. For non-Fortify SAST tools, use `sast-scan import-sarif`. For non-Fortify DAST tools which produce a SARIF output, use the `sast-scan import-sarif`.
- **OSS scan type:** The `--type` flag for `oss-scan import` currently only accepts `CycloneDX`. This is also the default, so the flag is optional.
