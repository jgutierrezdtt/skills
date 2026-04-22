## Use Case: ScanCentral DAST — Scan Status, Sensor Health, and Downloads

ScanCentral DAST (SC-DAST) is Fortify's centralized dynamic application security testing infrastructure. Scan requests are submitted against a target URL using a defined scan policy and settings; the SC-DAST Controller assigns the job to an available sensor, which runs WebInspect to perform the DAST scan. Results can be published to an SSC application version upon completion.

This use case covers **read-only** SC-DAST operations: listing and querying scans, getting scan details, checking sensor health, and downloading scan artifacts. Do not start, pause, resume, or cancel scans here — focus is on observability.

---

### Authentication Note

`fcli sc-dast` commands use the same session as `fcli ssc`.

Check the current session:
```bash
fcli ssc session ls --query "name=='default' && expired=='No'"
```
The session list output shows the SC-DAST URL if configured. If expired or absent, prompt the user to ensure SC-DAST is configured, and if so, to run `fcli ssc session login` again.

---

### Scan States

SC-DAST uses PascalCase state names (unlike SC-SAST which uses ALL_CAPS). The `scanStatusTypeDescription` field is the human-readable string form used in `--query` filters.

| State | Category | Meaning |
|-------|----------|---------|
| `Pending` | Active | Submitted, awaiting assignment to a sensor |
| `Queued` | Active | Acknowledged by controller, waiting for an available sensor |
| `Running` | Active | Actively scanning on a sensor |
| `PausingScan` | Transitional | Pause requested, pending acknowledgment |
| `Paused` | Paused | Scan is paused; can be resumed |
| `ResumingScan` | Transitional | Resume requested, pending acknowledgment |
| `ResumeScanQueued` | Transitional | Resume acknowledged, waiting for a sensor |
| `CompletingScan` | Transitional | Forced-complete requested |
| `Complete` | Terminal | Scan finished normally |
| `ForcedComplete` | Terminal | Scan was forced to complete early |
| `Interrupted` | Terminal | Scan was interrupted unexpectedly |
| `FailedToStart` | Terminal | Scan could not be started (config or sensor error) |
| `LicenseUnavailable` | Terminal | No license available for the sensor |
| `PendingApproval` | Blocked | Scan requires manual approval before running |
| `Rejected` | Terminal | Scan was rejected during the approval workflow |
| `ProcessingScanArtifacts` | Post-scan | Scan complete; artifacts being processed |
| `ImportingScanResults` | Post-scan | Importing scan results into the platform |
| `ImportScanResultsFailed` | Terminal | Import of scan results failed |

**Publish states** (tracked separately via `publishStatusTypeDescription`): `NotPublished`, `Publishing`, `Published`, `PublishFailed`.

---

### Scan Identifier

SC-DAST scans use a **numeric `id`** (integer) as their primary identifier — not a token string like SC-SAST. Use this `id` in `scan get` and `scan download` commands.

---

### Stage 1: Listing and Filtering Scans

**List all scans:**
```bash
fcli sc-dast scan list -o json
```

**List currently active scans (pending, queued, or running):**
```bash
fcli sc-dast scan list \
  --query "scanStatusTypeDescription=='Running' || scanStatusTypeDescription=='Queued' || scanStatusTypeDescription=='Pending'" \
  -o json
```

**List scans in a single state:**
```bash
# Running scans only
fcli sc-dast scan list --query "scanStatusTypeDescription=='Running'" -o json

# Queued scans (waiting for a sensor)
fcli sc-dast scan list --query "scanStatusTypeDescription=='Queued'" -o json

# Paused scans
fcli sc-dast scan list --query "scanStatusTypeDescription=='Paused'" -o json

# Failed scans (FailedToStart or interrupted)
fcli sc-dast scan list \
  --query "scanStatusTypeDescription=='FailedToStart' || scanStatusTypeDescription=='Interrupted'" \
  -o json

# Scans awaiting approval
fcli sc-dast scan list --query "scanStatusTypeDescription=='PendingApproval'" -o json
```

**Filter by time window:**
```bash
# Scans started in the last 24 hours
fcli sc-dast scan list \
  --query "#date(startedDateTime) > #now('-1d')" -o json

# Scans completed in the last 24 hours
fcli sc-dast scan list \
  --query "scanStatusTypeDescription=='Complete' && #date(scanStatusDateTime) > #now('-1d')" \
  -o json

# Scans completed in the last 7 days
fcli sc-dast scan list \
  --query "scanStatusTypeDescription=='Complete' && #date(scanStatusDateTime) > #now('-7d')" \
  -o json
```

**Count completed scans in the past day:**
```bash
fcli sc-dast scan list \
  --query "scanStatusTypeDescription=='Complete' && #date(scanStatusDateTime) > #now('-1d')" \
  -o json | python -c "import sys,json; print(len(json.load(sys.stdin)))"
```

**Filter by target application:**
```bash
fcli sc-dast scan list \
  --query "applicationName=='MyApp' && applicationVersionName=='1.0'" -o json
```

**Filter by scan name or URL:**
```bash
# By scan name (partial match)
fcli sc-dast scan list \
  --query "name matches '(?i).*payment.*'" -o json

# By target URL (partial match)
fcli sc-dast scan list \
  --query "url matches '(?i).*myapp\\.example\\.com.*'" -o json
```

**Server-side text search** (more efficient for large scan histories):
```bash
fcli sc-dast scan list --server-queries="searchText=payment" -o json
```

**Filter by scan type:**
```bash
# Standard scans only
fcli sc-dast scan list --query "scanTypeDescription=='Standard'" -o json

# API scans
fcli sc-dast scan list --query "scanTypeDescription=='API'" -o json
```

**Filter by policy:**
```bash
fcli sc-dast scan list --query "policyName=='Standard'" -o json
```

**Filter by publish status:**
```bash
# Published scans
fcli sc-dast scan list --query "publishStatusTypeDescription=='Published'" -o json

# Completed but not yet published
fcli sc-dast scan list \
  --query "scanStatusTypeDescription=='Complete' && publishStatusTypeDescription=='NotPublished'" \
  -o json
```

**Key scan fields available in output:**

| Field | Description |
|-------|-------------|
| `id` | Numeric scan identifier (use in `scan get` and `scan download`) |
| `name` | Scan name |
| `url` | Target URL |
| `scanTypeDescription` | Scan type: `Standard`, `API`, etc. |
| `scanStatusTypeDescription` | Current scan state (see state table above) |
| `scanStatusDateTime` | Timestamp of the last state change |
| `publishStatusTypeDescription` | SSC publish state: `NotPublished`, `Published`, etc. |
| `startedDateTime` | When the scan started running on a sensor |
| `createdDateTime` | When the scan was submitted |
| `createdBy` | Username that created the scan |
| `duration` | Scan duration (product-internal units; use `startedDateTime`/`scanStatusDateTime` difference for reliable elapsed time) |
| `criticalCount` | Critical findings count |
| `highCount` | High findings count |
| `mediumCount` | Medium findings count |
| `lowCount` | Low findings count |
| `requestCount` | Total HTTP requests sent |
| `failedRequestCount` | Requests that returned errors |
| `kilobytesSent` | Data volume sent to target |
| `kilobytesReceived` | Data volume received from target |
| `applicationName` | SSC application name |
| `applicationVersionName` | SSC application version name |
| `scannerName` | Name of the sensor that ran (or is running) this scan |
| `scannerPoolName` | Name of the sensor pool |
| `policyName` | Scan policy used |
| `hasFPR` | `true` if an FPR is available for download |
| `hasScanResults` | `true` if scan results (findings) are available |
| `hasScanLogs` | `true` if scan logs are available |
| `hasSiteTree` | `true` if a site tree is available |
| `activeAlertsCount` | Number of active (unresolved) alerts |
| `unacknowledgedAlertsCount` | Alerts not yet acknowledged by an operator |
| `submitForAudit` | Whether findings were submitted for SSC audit |
| `enableSASTCorrelation` | Whether SAST-DAST correlation is enabled |
| `scanScheduleName` | Originating schedule name if launched via schedule |

---

### Stage 2: Getting Details for a Specific Scan

Use `fcli sc-dast scan get` when you have a specific scan ID:

```bash
fcli sc-dast scan get <scanId> -o json
```

This returns the same fields as `scan list` with the addition of a top-level `scanStatus` string field. Useful for checking a single known scan.

**Check whether a scan has findings ready:**
```bash
fcli sc-dast scan get <scanId> -o json | \
  python -c "
import sys, json
d = json.load(sys.stdin)
print(f\"Status: {d['scanStatusTypeDescription']}\")
print(f\"FPR available: {d['hasFPR']}\")
print(f\"Results available: {d['hasScanResults']}\")
print(f\"Critical: {d['criticalCount']}, High: {d['highCount']}, Medium: {d['mediumCount']}, Low: {d['lowCount']}\")
"
```

**Compute elapsed scan time** from datetime fields:
```bash
fcli sc-dast scan get <scanId> -o json | \
  python -c "
import sys, json
from datetime import datetime
d = json.load(sys.stdin)
started = d.get('startedDateTime')
finished = d.get('scanStatusDateTime')
if started and finished:
    t1 = datetime.fromisoformat(started.replace('Z', '+00:00'))
    t2 = datetime.fromisoformat(finished.replace('Z', '+00:00'))
    print(f'Elapsed: {str(t2 - t1).split(\".\")[0]}')
"
```

---

### Stage 3: Sensor Status and Health

**List all sensors:**
```bash
fcli sc-dast sensor list -o json
```

**Filter to active/online sensors:**
```bash
fcli sc-dast sensor list --query "scannerStatusTypeDescription=='Active'" -o json
```

**Filter to sensors currently running a scan:**
```bash
fcli sc-dast sensor list --query "currentScanId!=null" -o json
```

**Filter to offline sensors** (useful for infrastructure health checks):
```bash
fcli sc-dast sensor list --query "scannerStatusTypeDescription=='Offline'" -o json
```

**Get details for a specific sensor by name or ID:**
```bash
fcli sc-dast sensor get "<sensorNameOrId>" -o json
```

**Key sensor fields:**

| Field | Description |
|-------|-------------|
| `id` | Numeric sensor identifier |
| `name` | Sensor name |
| `scannerStatusTypeDescription` | Status: `Active`, `Offline`, `Running`, etc. |
| `scannerStatusDateTime` | Timestamp of the last status change |
| `currentScanId` | ID of the scan currently running on this sensor (`null` if idle) |
| `isEnabled` | Whether the sensor is enabled to accept scan jobs |
| `scannerPoolId` | ID of the pool this sensor belongs to |
| `scannerPoolName` | Name of the pool this sensor belongs to |
| `scannerTypeDescription` | Sensor type: `Fixed` (persistent) or `Dynamic` (auto-provisioned) |
| `ipAddress` | Sensor IP address |
| `operatingSystem` | OS name and version |
| `applicationVersion` | SC-DAST sensor agent version |
| `webInspectVersion` | WebInspect engine version installed on sensor |
| `description` | Optional sensor description |

**Count sensors by status:**
```bash
fcli sc-dast sensor list -o json | python -c "
import sys, json
from collections import Counter
sensors = json.load(sys.stdin)
counts = Counter(s['scannerStatusTypeDescription'] for s in sensors)
for status, n in sorted(counts.items()):
    print(f'{status}: {n}')
print(f'Total: {len(sensors)}')
"
```

**Show which sensors are running scans and on which app/version:**
```bash
fcli sc-dast sensor list --query "currentScanId!=null" -o json | python -c "
import sys, json
sensors = json.load(sys.stdin)
if not sensors:
    print('No sensors currently running a scan.')
else:
    for s in sensors:
        print(f\"{s['name']} (pool={s['scannerPoolName']}) → scan ID {s['currentScanId']}\")
"
```

**List pool membership** (SC-DAST sensors embed pool info; there is no separate `pool list` command):
```bash
fcli sc-dast sensor list -o json | python -c "
import sys, json
from collections import defaultdict
sensors = json.load(sys.stdin)
pools = defaultdict(list)
for s in sensors:
    pools[s['scannerPoolName']].append(s)
for pool, sns in sorted(pools.items()):
    active = sum(1 for s in sns if s['isEnabled'])
    running = sum(1 for s in sns if s['currentScanId'] is not None)
    print(f'{pool}: {len(sns)} sensors, {active} enabled, {running} currently scanning')
"
```

---

### Stage 4: Downloading Scan Artifacts

Use `fcli sc-dast scan download` to retrieve artifacts from a completed scan. The `-t` flag is **required** (no default). Confirm the relevant `has*` flag is `true` before downloading.

**Download types:**

| Type | Flag | Availability check | Description |
|------|------|--------------------|-------------|
| `fpr` | `-t fpr` | `hasFPR==true` | Fortify scan results for import into SSC |
| `results` | `-t results` | `hasScanResults==true` | Scan findings in native DAST format |
| `logs` | `-t logs` | `hasScanLogs==true` | WebInspect scan log |
| `settings` | `-t settings` | `webInspectSettingsStatusType==3` | Scan settings used (WebInspect XML or settings object) |
| `site-tree` | `-t site-tree` | `hasSiteTree==true` | Discovered site tree |

**Download the FPR:**
```bash
fcli sc-dast scan download <scanId> -t fpr
```

**Download to a specific file path:**
```bash
fcli sc-dast scan download <scanId> -t fpr -f ./scans/my-dast-results.fpr
```

**Download the scan logs:**
```bash
fcli sc-dast scan download <scanId> -t logs
```

**Download scan results (native format):**
```bash
fcli sc-dast scan download <scanId> -t results
```

**Download the site tree:**
```bash
fcli sc-dast scan download <scanId> -t site-tree
```

**Check availability before downloading:**
```bash
fcli sc-dast scan get <scanId> -o json | \
  python -c "
import sys, json
d = json.load(sys.stdin)
print(f'FPR:          {d[\"hasFPR\"]}')
print(f'Results:      {d[\"hasScanResults\"]}')
print(f'Logs:         {d[\"hasScanLogs\"]}')
print(f'Site tree:    {d[\"hasSiteTree\"]}')
"
```

---

### Common Patterns

**Summarize scan throughput by state:**
```bash
fcli sc-dast scan list -o json | python -c "
import sys, json
from collections import Counter
scans = json.load(sys.stdin)
counts = Counter(s['scanStatusTypeDescription'] for s in scans)
for state, n in sorted(counts.items()):
    print(f'{state}: {n}')
print(f'Total: {len(scans)}')
"
```

**Find all failed scans in the past 7 days:**
```bash
fcli sc-dast scan list \
  --query "(scanStatusTypeDescription=='FailedToStart' || scanStatusTypeDescription=='Interrupted' || scanStatusTypeDescription=='ImportScanResultsFailed') && #date(scanStatusDateTime) > #now('-7d')" \
  -o json | python -c "
import sys, json
for s in json.load(sys.stdin):
    print(f\"ID={s['id']} | {s['name']} | {s['scanStatusTypeDescription']} | {s.get('applicationName','?')}:{s.get('applicationVersionName','?')}\")
"
```

**Find scans with unacknowledged alerts:**
```bash
fcli sc-dast scan list \
  --query "unacknowledgedAlertsCount > 0" -o json | python -c "
import sys, json
for s in json.load(sys.stdin):
    print(f\"ID={s['id']} | {s['name']} | alerts={s['unacknowledgedAlertsCount']}\")
"
```

**Find long-running scans** (running for more than 4 hours):
```bash
fcli sc-dast scan list --query "scanStatusTypeDescription=='Running'" -o json | python -c "
import sys, json
from datetime import datetime, timezone, timedelta
threshold = datetime.now(timezone.utc) - timedelta(hours=4)
for s in json.load(sys.stdin):
    started = s.get('startedDateTime')
    if started:
        t = datetime.fromisoformat(started.replace('Z', '+00:00'))
        if t < threshold:
            age = datetime.now(timezone.utc) - t
            print(f\"ID={s['id']} | {s['name']} | running {str(age).split('.')[0]} | target={s['url']}\")
"
```

**Summarize finding counts for recently completed scans:**
```bash
fcli sc-dast scan list \
  --query "scanStatusTypeDescription=='Complete' && #date(scanStatusDateTime) > #now('-7d')" \
  -o json | python -c "
import sys, json
scans = json.load(sys.stdin)
for s in scans:
    print(f\"ID={s['id']} | {s['name']} | C={s['criticalCount']} H={s['highCount']} M={s['mediumCount']} L={s['lowCount']} | {s.get('applicationName','?')}:{s.get('applicationVersionName','?')}\")
"
```

---

### Fallback: Direct SC-DAST REST API

For SC-DAST operations not covered by named `fcli sc-dast` commands, use the REST passthrough. Always apply the Safety Rules from the main SKILL.md before any mutating call.

```bash
fcli sc-dast rest call -X GET /api/v2/<endpoint>
fcli sc-dast rest call -X GET "/api/v2/<endpoint>?param=value"
```

Consult `references/scdast-openapi-spec.json` for endpoint paths, query parameters, and response schemas. The spec is large — load only the relevant section. The SC-DAST API version is `v2`.

**Common REST patterns:**

```bash
# Get scan summary list (equivalent to scan list)
fcli sc-dast rest call -X GET "/api/v2/scans/scan-summary-list"

# Get a specific scan's summary
fcli sc-dast rest call -X GET "/api/v2/scans/<scanId>/scan-summary"

# Get scan findings
fcli sc-dast rest call -X GET "/api/v2/scans/<scanId>/findings"

# Get scan event logs
fcli sc-dast rest call -X GET "/api/v2/scans/<scanId>/scan-event-logs"

# Get scan alerts
fcli sc-dast rest call -X GET "/api/v2/scans/<scanId>/scan-alerts"

# List all sensors
fcli sc-dast rest call -X GET "/api/v2/scanners"

# List scanner pools
fcli sc-dast rest call -X GET "/api/v2/scanner-pools/summary-list"

# List scan schedules
fcli sc-dast rest call -X GET "/api/v2/scan-schedules"

# Get application-level scan summary list
fcli sc-dast rest call -X GET "/api/v2/applications/<applicationId>/scan-summary-list"
```

> **Root API path:** All SC-DAST endpoints use `/api/v2/` (unlike SSC which uses `/api/v1/`). Scan IDs in SC-DAST are numeric integers, not token strings.

If no REST endpoint is obvious, explore available `fcli sc-dast` sub-commands:
```bash
fcli sc-dast -h
fcli sc-dast <module> -h
```
