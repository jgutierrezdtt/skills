## Use Case: Artifact Upload & Processing

In SSC, scan results enter the system as **artifacts** — FPR files or compatible formats uploaded to an application version. After upload, SSC processes the artifact asynchronously and updates the version's issues. This use case covers the full artifact lifecycle: uploading, monitoring processing, and interpreting results.

---

### Step 1 — Identify the target application version

You need the version identifier (`--av`) before uploading. If the version name is not already explicit, load `references/resolving-appversion.md` for the full resolution workflow.

Confirm the version exists and is ready for uploads:
```bash
fcli ssc appversion get "<AppName>:<VersionName>" -o json
# → check: committed==true, currentState.analysisUploadEnabled==true
```

If the version doesn't exist yet, create it first. Load `references/use-case-create-version.md`.

---

### Step 2 — Verify Branch/Version Alignment

Run all commands below **before** prompting the user — collect all alignment information in one pass, then surface any issues in a single confirmation.

**Collect alignment data (run silently)**

```bash
# Current branch
git branch --show-current

# All versions for this application — compare names against the branch list
fcli ssc appversion list --query "application.name=='<AppName>'" \
  -o table --columns name,id,issueTemplate,committed

# All local/remote branches — compare against the version list
git branch -a --format='%(refname:short)' | sed 's|^origin/||' | sort -u
```

**Evaluate findings**

| Finding | Treatment |
|---------|-----------|
| Version resolved from a user-supplied numeric ID | ✅ Skip all checks — explicit choice made. Proceed to Step 3. |
| `git branch` returned empty (detached HEAD / no git context) | ✅ No comparison possible. Proceed to Step 3. |
| Current branch **exactly matches** the resolved version name | ✅ Aligned. Proceed to Step 3. |
| Current branch **does not match** the resolved version name | ⚠️ Include in prompt |
| Another SSC version exists whose name matches the current branch | ⚠️ Include in prompt |
| Other git branches match other SSC version names (not the resolved target) | ℹ️ Mention alongside the prompt if one is required; otherwise note briefly when presenting Step 3 |

**Prompt the user (at most once)**

If all findings are ✅, proceed to Step 3 without prompting.

If any ⚠️ findings exist, send **one** message covering all of them:

> ⚠️ **Version alignment — please confirm before proceeding**
>
> - Current git branch: **`<currentBranch>`**
> - Target SSC application version: **`<resolvedVersionName>`**
> - [if names differ] These do not match. If you meant to upload results for `<currentBranch>`, a dedicated SSC application version may need to be created first.
> - [if a version named `<currentBranch>` already exists in SSC] A version named `<currentBranch>` already exists (ID: `<id>`). Did you mean to upload to that one?
> - [if other branch/version overlaps] Other branches with matching SSC versions: `<list>`
>
> How would you like to proceed?
> - **Continue** — upload to the `<resolvedVersionName>` version as originally resolved
> - **Switch** — switch to the `<currentBranch>` version (ID: `<id>`)
> - **Create** — create a new `<currentBranch>` version first (I'll handle it using `use-case-create-version.md`)
> - **Cancel** — stop here so you can manually correct the target version

Wait for the user's single reply, then act on it. Do **not** ask follow-up alignment questions.

---

### Step 2 → Step 3 gate

Before running any upload command, confirm:

- [ ] Target application version exists and `committed==true` and `analysisUploadEnabled==true`
- [ ] Branch/version alignment verified (Step 2) — mismatch acknowledged or confirmed intentional
- [ ] Correct upload command selected for the source format (FPR → `artifact upload`; third-party raw → `artifact upload --engine-type`; Debricked OSS → `artifact import-debricked`)
- [ ] Source file path verified to exist locally
- [ ] User has confirmed this is the correct target version

Do NOT run any upload command until the user has confirmed the target version and source file.

---

### Step 3 — Upload the artifact

**Upload a standard Fortify FPR file** (from ScanCentral SAST, Fortify SCA, or WebInspect):
```bash
fcli ssc artifact upload --av="<AppName>:<VersionName>" -f=<path/to/results.fpr>
```

**Store the artifact ID for the next step** (recommended):
```bash
fcli ssc artifact upload --av="<AppName>:<VersionName>" -f=results.fpr \
  --store=artifact -o json
```

**Upload a third-party result using a parser plugin** (for tools that output raw non-Fortify formats):
```bash
fcli ssc artifact upload --av="<AppName>:<VersionName>" -f=results.zip \
  --engine-type=<ParserPluginEngineType>
```

The `--engine-type` flag is only needed for raw third-party results not packaged with a `scan.info` file. Standard FPR files and zip packages with `scan.info` do not need it.

**Import Debricked open source scan results:**
```bash
fcli ssc artifact import-debricked \
  --av="<AppName>:<VersionName>" \
  --repository=<owner/repo> \
  --branch=<branch>
```

---

### Step 4 — Wait for processing

After upload, SSC processes the artifact asynchronously. Poll for completion using the artifact ID:

**Using the stored variable from upload:**
```bash
fcli ssc artifact upload --av="<AppName>:<VersionName>" -f=results.fpr \
  --store=artifact -o json
fcli ssc artifact wait-for ::artifact::id
```

See `references/fcli-query-output.md` ("`--store` — Variable Chaining") for the reference syntax and the rule that variable references must be passed as a separate argument (not joined with `=`).

**Using an explicit artifact ID:**
```bash
fcli ssc artifact wait-for <artifactId>
```

**With a custom timeout** (default: no timeout — waits indefinitely):
```bash
fcli ssc artifact wait-for <artifactId> --timeout=10m
```

**Artifact processing states:**

| Status | Meaning |
|--------|---------|
| `SCHED_PROCESSING` | Queued for processing |
| `PROCESSING` | Currently being processed |
| `PROCESS_COMPLETE` | Successfully processed; issues are updated |
| `REQUIRE_AUTH` | Requires approval before processing |
| `ERROR_PROCESSING` | Processing failed |
| `PURGED` | Artifact data has been purged |

If `REQUIRE_AUTH` is returned, the SSC instance is configured to require approval before processing scans from certain users or engines. An administrator must approve the artifact:
```bash
fcli ssc artifact approve <artifactId> --comment="Approved for processing"
```

---

### Step 5 — Verify processing results

After `PROCESS_COMPLETE`, check the artifact details to confirm what was processed:
```bash
fcli ssc artifact get <artifactId> -o json
```

Key fields to inspect:
- `status` — should be `PROCESS_COMPLETE`
- `scaStatus` — `PROCESSED` if SAST results were ingested; `NOT_EXIST` if none
- `webInspectStatus` — `PROCESSED` if DAST results were ingested
- `otherStatus` — `PROCESSED` if third-party parser results were ingested
- `scanErrorsCount` — non-zero means some issues during processing (check `messages`)
- `messages` — processing warnings or info notes

---

### Listing artifact history

**All artifacts for a version** (most recent first in the list):
```bash
fcli ssc artifact list --av="<AppName>:<VersionName>" -o json
```

**Filter to recently uploaded artifacts:**
```bash
fcli ssc artifact list --av="<AppName>:<VersionName>" \
  --query "#date(uploadDate) > #now('-7d')" -o json
```

**Filter to artifacts with processing errors:**
```bash
fcli ssc artifact list --av="<AppName>:<VersionName>" \
  --query "status=='ERROR_PROCESSING'" -o json
```

**Checking the latest scan date for a version** — use `currentState.lastFprUploadDate` from the version record (faster than querying artifact history):
```bash
fcli ssc appversion get "<AppName>:<VersionName>" -o json
# → currentState.lastFprUploadDate
```

---

### Notes and constraints

- **Processing is asynchronous.** The artifact upload command returns immediately; processing happens in the background. Always use `artifact wait-for` before querying updated issue data.
- **One-way upload.** SSC does not support downloading the original FPR file back unless `fileURL` is populated (rare). The `artifact download` command retrieves the stored FPR if available.
- **Approval gates.** Some SSC configurations require artifact approval before processing (`REQUIRE_AUTH` status). Check with your SSC administrator if you see this status unexpectedly.
- **Multiple scan types in one FPR.** A single FPR artifact may contain results from multiple engines (e.g., SCA + WebInspect). The `scanTypes` field shows which types are present; `scaStatus` and `webInspectStatus` show the processing result for each.
- **Metric refresh.** After processing, SSC updates metrics (performance indicators, variables) on a schedule. If you query issue counts immediately after processing, they may reflect stale data. Force a refresh if needed:
  ```bash
  fcli ssc appversion refresh-metrics "<AppName>:<VersionName>"
  ```
  Note: `refresh-metrics` takes the app version as a positional argument, not as `--av`.
