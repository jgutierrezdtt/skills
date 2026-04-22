## Use Case: Scan Status — Checking Scan Health

The user wants to understand whether scans have run, their results, or their current state (e.g., "when did the last SAST scan run?", "show me all in-progress scans", "are there any failed scans today?", "what changed in the most recent scan?").

> If the release name is not already resolved, load `references/resolving-release.md` first.

**List all scans for a release** (all types, historical) — use the REST passthrough:
```bash
fcli fod rest call -X GET "/api/v3/releases/<releaseId>/scans" -o json
```

> Note: `fcli fod scan list` does not exist. Use the REST endpoint above for historical scan records, or use release-level fields (`currentStaticScanId`, `staticAnalysisStatusType`, etc.) for current-scan status.

**Check the latest scan of each type for a specific release:**

The `*-scan get` commands require a positional scan ID, not `--rel`. Get the scan ID from the release data first:
```bash
# Step 1 — get scan IDs from release data
fcli fod release get "<AppName:ReleaseName>" -o json
# → fields: currentStaticScanId, currentDynamicScanId, currentMobileScanId

# Step 2 — retrieve scan details by ID
fcli fod sast-scan get <currentStaticScanId> -o json   # Static / SAST
fcli fod dast-scan get <currentDynamicScanId> -o json  # Dynamic / DAST
fcli fod oss-scan get  <currentOssScanId> -o json      # Open Source / SCA
fcli fod mast-scan get <currentMobileScanId> -o json   # Mobile / MAST
```

**Compare scan details between two different scans using the Scan ID:**
```bash
fcli fod sast-scan get <scanId1> -o json   # Scan ID #1
fcli fod sast-scan get <scanId2> -o json   # Scan ID #2
```

**Cross-release scan status queries** — use release-level fields rather than the scan commands when querying across multiple releases:
```bash
# Releases with scans currently in progress
fcli fod release list --query "currentAnalysisStatusType=='InProgress'" -o json

# Releases whose static scan completed on a specific date (use string match — #date() does not
# work for FoD scan date fields, which include a time component incompatible with #date())
fcli fod release list --query "staticScanDate!=null && staticScanDate matches '2026-04-15.*'" -o json

# Releases with no completed static scan
fcli fod release list --query "staticAnalysisStatusType!='Completed'" -o json
```

Scan data includes issue counts, technology stack, engine version, and entitlement consumed. See `references/fcli-fod-output-samples.md` for JSON field examples.

> To start a new scan, see the Start Scan use case (`references/use-case-start-scan.md`).
