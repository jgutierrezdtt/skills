## Use Case: ScanCentral SAST — Scan Job Status, Sensor Health, and Downloads

ScanCentral SAST (SC-SAST) is Fortify's centralized scanning infrastructure. Users package and submit their code to the SC-SAST Controller via the ScanCentral Client; the Controller distributes scan jobs to sensors, which run Fortify SCA. Completed FPRs are either published directly to an SSC application version or returned to the submitter.

This use case covers **read-only** SC-SAST operations: listing and querying scan jobs, checking sensor and pool status, and downloading scan artifacts. Do not start or cancel scans here — focus is on observability.

---

### Authentication Note

`fcli sc-sast` commands use the same session as `fcli ssc`. However, some commands require a direct connection to the SC-SAST Controller and will only work if the session was established with a **client auth token**.

**Before running SC-SAST commands, verify the session supports SC-SAST:**

```bash
fcli ssc session ls --query "name=='default' && expired=='No'"
```

Inspect the `url` field in the output. It contains one line per connected service:

```
SSC:     https://ssc.example.com
SC-SAST: https://scsast.example.com          ← direct SC-SAST connection available
SC-DAST: https://scdastapi.example.com
```

If the SC-SAST line reads:

```
SC-SAST: N/A (No client-auth-token)
```

…then the session was created without a client auth token. Commands that rely on the direct SC-SAST REST API (`scan status`, `pool list`, `scan download`, and `sensor list --pool=...`) will fail. You must prompt the user to re-establish their SSC session with a client auth token:

```bash
fcli ssc session login --url=<ssc-url> \
  --client-auth-token=<token> \
  --username=<user> --password=<pw>
```

The `--client-auth-token` is a ScanCentral shared secret configured in the SC-SAST Controller (`config.properties`). The user's SSC administrator can provide it.

**Commands that work with an SSC-only session (no client auth token needed):**
- `fcli sc-sast scan list`
- `fcli sc-sast sensor list` (without `--pool`)
- `fcli ssc rest call /api/v1/cloudpools` (use instead of `fc sc-sast pool list`)

**Commands that require a client auth token:**
- `fcli sc-sast scan status <jobToken>`
- `fcli sc-sast scan download <jobToken>`
- `fcli sc-sast pool list`
- `fcli sc-sast sensor list --pool=<poolNameOrUuid>`

---

### Scan Job States

| State | Meaning |
|-------|---------|
| `PENDING` | Submitted but not yet acknowledged by controller |
| `QUEUED` | Waiting in queue for an available sensor |
| `RUNNING` | Actively scanning on a sensor |
| `CANCELING` | Cancel requested, awaiting acknowledgment |
| `CANCELED` | Scan was canceled |
| `COMPLETED` | Scan finished; FPR available for download or published to SSC |
| `FAILED` | Scan failed (see log for details) |
| `FAULTED` | Infrastructure fault; sensor may have crashed |
| `TIMEOUT` | Scan exceeded the configured time limit |

The `publishState` field tracks FPR publication to SSC: `NO_PUBLISH` (no `--publish-to` was used), or the SSC artifact processing state if publishing was configured.

Duration fields (`jobDuration`, `scanDuration`, `queuedDuration`) are in **milliseconds**.

---

### Step 1: Listing and Filtering Scan Jobs

**List all scan jobs (all states):**
```bash
fcli sc-sast scan list -o json
```

**List currently active scans (running + queued):**
```bash
fcli sc-sast scan list \
  --query "jobState=='RUNNING' || jobState=='QUEUED'" -o json
```

**List scans in a single state:**
```bash
# Running scans only
fcli sc-sast scan list --query "jobState=='RUNNING'" -o json

# Queued scans (waiting for a sensor)
fcli sc-sast scan list --query "jobState=='QUEUED'" -o json

# Failed or faulted scans (need investigation)
fcli sc-sast scan list \
  --query "jobState=='FAILED' || jobState=='FAULTED'" -o json
```

**Filter by time window:**
```bash
# Scans queued in the last 24 hours
fcli sc-sast scan list \
  --query "#date(jobQueuedTime) > #now('-1d')" -o json

# Scans completed in the last 24 hours
fcli sc-sast scan list \
  --query "jobState=='COMPLETED' && #date(jobFinishedTime) > #now('-1d')" -o json

# Scans completed in the last 7 days
fcli sc-sast scan list \
  --query "jobState=='COMPLETED' && #date(jobFinishedTime) > #now('-7d')" -o json
```

**Count completed scans in the past day:**
```bash
fcli sc-sast scan list \
  --query "jobState=='COMPLETED' && #date(jobFinishedTime) > #now('-1d')" \
  -o json | python -c "import sys,json; print(len(json.load(sys.stdin)))"
```

**Filter by submitter:**
```bash
fcli sc-sast scan list \
  --query "submitterUserName=='jsmith'" -o json
```

**Filter by application version:**
```bash
# By application version name
fcli sc-sast scan list \
  --query "projectName=='MyApp' && pvName=='main'" -o json
```

**Key scan job fields available in output:**

| Field | Description |
|-------|-------------|
| `jobToken` | Unique identifier for the scan job (use as token in `status`/`download`) |
| `jobState` | Current state (see table above) |
| `jobQueuedTime` | When the job was placed in queue |
| `jobStartedTime` | When scanning began on a sensor |
| `jobFinishedTime` | When scanning completed |
| `jobDuration` | Total job wall time in milliseconds |
| `scanDuration` | Time spent actively scanning (ms) |
| `queuedDuration` | Time spent waiting in queue (ms) |
| `jobHasFpr` | `true` if an FPR is available for download |
| `jobHasLog` | `true` if a client log is available |
| `jobCancellable` | `true` if the job can still be canceled |
| `projectName` | SSC application name |
| `pvName` | SSC application version name |
| `submitterUserName` | Username that submitted the scan |
| `submitterEmail` | Email of the submitter |
| `clientVersion` | ScanCentral Client version used |
| `scaVersion` | Fortify SCA version used by the sensor |
| `scaBuildId` | SCA build ID for this job |
| `cloudPool.name` | Sensor pool this job was assigned to |
| `cloudWorker.hostName` | Sensor hostname that processed this job |

---

### Step 2: Getting Status for a Specific Scan Job

> **Requires client auth token.** `fcli sc-sast scan status` connects directly to the SC-SAST Controller. If the session shows `SC-SAST: N/A (No client-auth-token)`, see the Authentication Note above before proceeding.

Use `fcli sc-sast scan status` when you have a specific job token:

```bash
fcli sc-sast scan status <jobToken> -o json
```

This returns the same fields as `scan list` but for a single job. Useful when a CI/CD pipeline stored the token and needs a fresh status check.

**Check whether an FPR is ready:**
```bash
fcli sc-sast scan status <jobToken> -o json | \
  python -c "import sys,json; d=json.load(sys.stdin); print(f\"state={d['jobState']}, hasFpr={d['jobHasFpr']}\")"
```

---

### Step 3: Sensor Status and Utilization

**List all sensors:**
```bash
fcli sc-sast sensor list -o json
```

**Filter to active sensors:**
```bash
fcli sc-sast sensor list --query "state=='ACTIVE'" -o json
```

**Filter to sensors in a specific pool:**
```bash
fcli sc-sast sensor list --pool="<poolNameOrUuid>" -o json
```

**Key sensor fields:**

| Field | Description |
|-------|-------------|
| `uuid` | Unique sensor identifier |
| `hostName` | Sensor machine hostname |
| `state` | `ACTIVE`, `INACTIVE`, or `STALE` |
| `lastSeen` | Last heartbeat timestamp |
| `lastActivity` | Last activity type (e.g., `workrequest`) |
| `cloudPool.name` | Pool this sensor belongs to |
| `scaVersion` | Fortify SCA version installed on sensor |
| `sensorVersion` | SC-SAST sensor agent version |
| `availableProcessors` | CPU core count |
| `totalPhysicalMemory` | RAM in bytes |
| `osName` | Operating system (e.g., `Linux`, `Windows`) |
| `workerStartTime` | When the sensor process started |
| `workerExpiryTime` | When the sensor's registration expires |

**Count active sensors:**
```bash
fcli sc-sast sensor list --query "state=='ACTIVE'" -o json | \
  python -c "import sys,json; print(len(json.load(sys.stdin)))"
```

**Identify stale or inactive sensors** (useful for infrastructure health checks):
```bash
fcli sc-sast sensor list \
  --query "state=='STALE' || state=='INACTIVE'" -o json
```

---

### Step 4: Sensor Pool Status and Utilization

> **Requires client auth token.** `fcli sc-sast pool list` and `fcli sc-sast sensor list --pool=...` connect directly to the SC-SAST Controller. If the session shows `SC-SAST: N/A (No client-auth-token)`, use the SSC REST API fallback below (which works with an SSC-only session).

Pool listing requires the SCSAST client auth token to be configured in the session. If this is available:

```bash
fcli sc-sast pool list -o json
```

**If pool listing fails** with "No client-auth-token", use the SSC REST API fallback:
```bash
fcli ssc rest call /api/v1/cloudpools -o json
```

**Key pool fields** (from the `stats` nested object):

| Field | Description |
|-------|-------------|
| `name` | Pool name |
| `uuid` | Pool UUID |
| `stats.totalWorkerCount` | Total sensors registered |
| `stats.activeWorkerCount` | Sensors currently online/heartbeating |
| `stats.idleWorkerCount` | Sensors online and not running a scan |
| `stats.processingWorkerCount` | Sensors currently scanning |
| `stats.staleWorkerCount` | Sensors that have missed recent heartbeats |
| `stats.inactiveWorkerCount` | Sensors that have not checked in |
| `stats.runningJobCount` | Jobs actively scanning |
| `stats.pendingJobCount` | Jobs queued and waiting |
| `stats.projectVersionCount` | App versions mapped to this pool |

**Summarize utilization across all pools:**
```bash
fcli ssc rest call /api/v1/cloudpools -o json | python -c "
import sys, json
pools = json.load(sys.stdin)
for p in pools:
    s = p.get('stats') or {}
    print(f\"{p['name']}: {s.get('runningJobCount',0)} running, {s.get('pendingJobCount',0)} queued, {s.get('activeWorkerCount',0)}/{s.get('totalWorkerCount',0)} sensors active\")
"
```

**Filter pools with queued jobs** (scan backlog indicator):
```bash
fcli ssc rest call /api/v1/cloudpools -o json | python -c "
import sys, json
for p in json.load(sys.stdin):
    s = p.get('stats') or {}
    if (s.get('pendingJobCount') or 0) > 0:
        print(f\"{p['name']}: {s['pendingJobCount']} pending, {s.get('idleWorkerCount',0)} idle sensors\")
"
```

---

### Step 5: Downloading Scan Artifacts

> **Requires client auth token.** `fcli sc-sast scan download` connects directly to the SC-SAST Controller. If the session shows `SC-SAST: N/A (No client-auth-token)`, see the Authentication Note above before proceeding.

Use `fcli sc-sast scan download` to retrieve artifacts from a completed scan job. The job must be in `COMPLETED` state with the relevant artifact available (`jobHasFpr==true` or `jobHasLog==true`).

**Download types:**

| Type | Flag | Description |
|------|------|-------------|
| `fpr` | `-t fpr` | Fortify scan results (default if `-t` omitted) |
| `log` | `-t log` | ScanCentral Client log from the submitting machine |
| `sensor-log` | `-t sensor-log` | Log from the sensor that ran the scan |
| `job` | `-t job` | Job package (the scan request archive sent to the controller) |

**Download the FPR (default):**
```bash
fcli sc-sast scan download <jobToken>
# → saves to <jobToken>.fpr in current directory
```

**Download the FPR to a specific path:**
```bash
fcli sc-sast scan download <jobToken> -f ./scans/my-app-results.fpr
```

**Overwrite an existing file:**
```bash
fcli sc-sast scan download <jobToken> -f ./results.fpr -y
```

**Download the sensor log (for diagnosing scan failures):**
```bash
fcli sc-sast scan download <jobToken> -t sensor-log
# → saves to <jobToken>-sensor-log.log
```

**Download the client log:**
```bash
fcli sc-sast scan download <jobToken> -t log
# → saves to <jobToken>.log
```

**Download the job package:**
```bash
fcli sc-sast scan download <jobToken> -t job
# → saves to <jobToken>-job.zip
```

**Check before downloading** — confirm the artifact exists:
```bash
fcli sc-sast scan status <jobToken> -o json | \
  python -c "import sys,json; d=json.load(sys.stdin); print('FPR available:', d.get('jobHasFpr')); print('Log available:', d.get('jobHasLog'))"
```

---

### Common Patterns

**Find all failed scans in the past 7 days and show submitter + app:**
```bash
fcli sc-sast scan list \
  --query "(jobState=='FAILED' || jobState=='FAULTED') && #date(jobQueuedTime) > #now('-7d')" \
  -o json | python -c "
import sys, json
for j in json.load(sys.stdin):
    print(f\"{j['jobToken'][:8]}... | {j['projectName']}:{j['pvName']} | {j['jobState']} | submitter={j.get('submitterUserName','?')}\")
"
```

**Summarize scan throughput by state:**
```bash
fcli sc-sast scan list -o json | python -c "
import sys, json
from collections import Counter
jobs = json.load(sys.stdin)
counts = Counter(j['jobState'] for j in jobs)
for state, n in sorted(counts.items()):
    print(f'{state}: {n}')
print(f'Total: {len(jobs)}')
"
```

**Identify long-running scans** (running for more than 2 hours):
```bash
fcli sc-sast scan list --query "jobState=='RUNNING'" -o json | python -c "
import sys, json
from datetime import datetime, timezone, timedelta
threshold = datetime.now(timezone.utc) - timedelta(hours=2)
for j in json.load(sys.stdin):
    started = j.get('jobStartedTime')
    if started:
        t = datetime.fromisoformat(started.replace('Z', '+00:00'))
        if t < threshold:
            age = datetime.now(timezone.utc) - t
            print(f\"{j['jobToken'][:8]}... | {j['projectName']}:{j['pvName']} | running {str(age).split('.')[0]}\")
"
```

**Find the sensor running a specific scan:**
```bash
fcli sc-sast scan list --query "jobToken=='<jobToken>'" -o json | \
  python -c "import sys,json; j=json.load(sys.stdin)[0]; w=j.get('cloudWorker'); print(w['hostName'] if w else 'not yet assigned')"
```
