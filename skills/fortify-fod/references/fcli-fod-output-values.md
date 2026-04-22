# Fortify on Demand / fcli Returned Values Reference (fod module)

This document summarizes fields returned by the **Fortify CLI (fcli) `fod` module**
when interacting with **Fortify on Demand (FoD / OpenText Core Application Security)**.

Field names and values reflect what is returned by common fcli commands such as:
- `fod application get`
- `fod release get`
- `fod scan *`
- `fod sast-scan get`
- `fod issue list`

Note:  Fields prefixed with `fcli` are CLI conveniences and in most cases, can be mapped to the closest match by stripping the prefix.

## Table of Contents
- [General / Common Fields](#general--common-fields)
- [Applications](#applications)
- [Releases](#releases) — Core Metadata, Aggregate Issue Counts, Counts by Scan Type, Analysis Status, Per-Scan-Type Status, SCA Configuration
- [Scans](#scans) — Core Fields, Issue Counts, Summary Details (Static, Dynamic, Mobile)
- [Issues (Vulnerabilities)](#issues-vulnerabilities) — Identity & Correlation, Severity/Status/Lifecycle, Classification & Location, Scan & Release Association, Workflow/Audit/Collaboration, Suppression/Bugs/Visibility
- [Developer Status (Default Values)](#developer-status-default-values)
- [Auditor Status (Default Values & Suppression Semantics)](#auditor-status-default-values--suppression-semantics)
- [Fortify Aviator (AI-Assisted Audit & Remediation)](#fortify-aviator-ai-assisted-audit--remediation)
- [Terminology Equivalencies](#terminology-equivalencies)
- [Compliance & Standards Mappings](#compliance--standards-mappings-summary)
- [Issue Identity & Deduplication Guidance](#issue-identity--deduplication-guidance)
- [Identifier vs Display Field Pairs](#identifier-vs-display-field-pairs)
- [Recommended Usage for AI Agents](#recommended-usage-for-ai-agents)
- [fcli fod Modules](#fcli-fod-modules)

---

## General / Common Fields

| Field | Type | Description |
|-----|-----|-----|
| `id` | integer | Object identifier (often scan-specific unless noted) |
| `lastModifiedDate` | string (datetime) | Last modification timestamp |
| `createdDate` | string (datetime) | Creation timestamp |
| `offset` / `limit` | integer | Pagination controls |
| `totalCount` | integer | Total records available |
| `attributes` | array | Tenant-defined key/value metadata |

`attributes` entries follow a consistent structure across all object types:
```json
{ "name": "AttributeName", "id": 1001, "value": "AttributeValue" }
```
Attribute names and IDs are tenant-defined. Values are always strings.

---

## Applications

| Field | Type | Description |
|-----|-----|-----|
| `applicationId` | integer | Unique application identifier |
| `applicationName` | string | Application name |
| `applicationType` | string | `Web_Thick_Client`, `Mobile` |
| `applicationTypeId` | integer | Application type identifier |
| `businessCriticalityType` | string | `High`, `Medium`, `Low` |
| `businessCriticalityTypeId` | integer | Business criticality identifier |
| `emailList` | string | Notification email list (often empty) |
| `fcliApplicationType` | string | Human-readable application type (fcli convenience field) |
| `hasMicroservices` | boolean | Microservice-enabled application |
| `ownerId` | integer | Application owner |
| `starRating` / `rating` | integer | Overall security score (1–5) |
| `isPassed` | boolean | Policy pass/fail |
| `applicationDescription` | string \| null | Optional description of the application |
| `applicationCreatedDate` | string (datetime) | Application creation timestamp |

---

## Releases

### Core Release Metadata

| Field | Type | Description |
|-----|-----|-----|
| `releaseId` | integer | Unique release identifier |
| `releaseName` | string | Release name |
| `releaseDescription` | string | Optional description |
| `releaseCreatedDate` | string (datetime) | Release creation timestamp |
| `applicationId` | integer | Parent application ID |
| `applicationName` | string | Parent application name |
| `sdlcStatusType` | string | `Development`, `QA/Test`, `Production`, `Retired` |
| `sdlcStatusTypeId` | integer | SDLC status identifier |
| `suspended` | boolean | Release suspended |
| `ownerId` | integer | Release owner |
| `microserviceName` | string | Microservice name (if applicable) |
| `microserviceId` | integer \| null | Microservice identifier |

---

### Release Issue Counts (Aggregate)

Represents **all issues across all scan types**.

| Field | Type | Description |
|-----|-----|-----|
| `critical` | integer | Total critical issues |
| `high` | integer | Total high issues |
| `medium` | integer | Total medium issues |
| `low` | integer | Total low issues |
| `issueCount` | integer | Total issues |

---

### Release Issue Counts by Scan Type (Patterned)

For each scan type prefix:
```

static | dynamic | mobile | openSource

```

The following patterned fields may appear:

```

<scanType>Critical <scanType>High <scanType>Medium <scanType>Low

```

Examples:
- `staticCritical`, `staticHigh`
- `dynamicMedium`, `dynamicLow`
- `openSourceHigh`, `openSourceMedium`

Each value represents issues detected **only by that scan type**.

---

### Release Analysis Status

| Field | Type | Description |
|-----|-----|-----|
| `currentAnalysisStatusType` | string | Aggregate release analysis status |
| `currentAnalysisStatusTypeId` | integer | Status identifier |
| `isPassed` | boolean | Policy pass/fail |
| `passFailReasonType` | string \| null | Policy rationale |

---

### Per‑Scan‑Type Analysis Status (Patterned)

For each scan type (`static`, `dynamic`, `mobile`, `openSource`):

```

<scanType>AnalysisStatusType <scanType>AnalysisStatusTypeId <scanType>ScanDate

```

Examples:
- `staticAnalysisStatusType`, `staticScanDate`
- `dynamicAnalysisStatusTypeId`, `dynamicScanDate`

These fields describe the **most recent scan of that type** on the release.

The most recent **scan ID** for each type uses a different pattern with a `current` prefix and title-cased scan type:
```
currentStaticScanId
currentDynamicScanId
currentMobileScanId
```

---

### Open Source / SCA Configuration (Release Level)

| Field | Type | Description |
|-----|-----|-----|
| `IsDebrickedScanEnabled` | boolean | Whether Debricked is enabled for OSS scans |

---

## Scans

### Core Scan Fields

| Field | Type | Description |
|-----|-----|-----|
| `scanId` | integer | Unique scan identifier |
| `releaseId` | integer | Target release |
| `applicationId` | integer | Parent application ID |
| `applicationName` | string | Parent application name |
| `releaseName` | string | Parent release name |
| `scanTypeId` | integer | Numeric scan type identifier |
| `scanType` | string | `Static`, `Dynamic`, `Mobile`, `OpenSource`, `Network`, `Monitoring` |
| `assessmentTypeId` | integer | Assessment type identifier |
| `assessmentTypeName` | string | Assessment type (e.g., `Static Assessment`) |
| `analysisStatusTypeId` | integer | Numeric analysis status identifier |
| `analysisStatusType` | string | `NotStarted`, `Waiting`, `InProgress`, `Completed`, `Paused`, `Canceled` |
| `analysisStatusReasonNotes` | string \| null | Supplemental notes on the analysis status (e.g., cancellation reason detail) |
| `startedDateTime` | string (datetime) | Scan start timestamp |
| `completedDateTime` | string (datetime) | Scan completion timestamp |
| `startedByUserId` | integer | User ID of the person or service account that initiated the scan |
| `startedByUserName` | string | Username of the initiator |
| `scanMethodTypeId` | integer | Numeric scan method identifier |
| `scanMethodTypeName` | string | Scan submission method (e.g., `IDE`, `CICD`, `Other`) |
| `scanTool` | string | Producing tool (e.g., `fcli`) |
| `scanToolVersion` | string | Tool version |
| `isRemediationScan` | boolean | Remediation validation scan |
| `isFalsePositiveChallenge` | boolean | Scan triggered by a false positive challenge |
| `entitlementId` | integer | Entitlement used for this scan |
| `entitlementUnitsConsumed` | integer | Units consumed from the entitlement |
| `isSubscriptionEntitlement` | boolean | Whether the entitlement is subscription-based (vs. single-scan) |
| `notes` | string | User-supplied notes attached to the scan |
| `cancelReason` | string \| null | Reason the scan was canceled, if applicable |
| `pauseDetails` | array | List of pause events; each entry describes a pause interval |
| `starRating` | integer | Security score for the release at scan completion (1–5) |
| `attributes` | array \| null | Tenant-defined key/value metadata |

---

### Scan Issue Counts

Issue counts reported at the **scan level** (distinct from release-level aggregates).

| Field | Type | Description |
|-----|-----|-----|
| `totalIssues` | integer | Total issues detected in this scan |
| `issueCountCritical` | integer | Critical severity issues |
| `issueCountHigh` | integer | High severity issues |
| `issueCountMedium` | integer | Medium severity issues |
| `issueCountLow` | integer | Low severity issues |

---

### Scan Summary Details

Nested summary objects returned per scan type. Null when the scan type was not performed.

#### `staticScanSummaryDetails`

Returned by `fod sast-scan get` for Static (SAST) scans.

| Field | Type | Description |
|-----|-----|-----|
| `technologyStack` | string | Detected technology stack (e.g., `JAVA/J2EE/Kotlin`) |
| `languageLevel` | string | Language/compiler level (e.g., `1.8`) |
| `doSonatypeScan` | boolean | Whether a Sonatype (SCA) scan was included |
| `auditPreferenceType` | string | Audit mode: `Automated` or `Manual` |
| `excludeThirdPartyLibs` | boolean | Third-party libraries excluded from analysis |
| `buildDate` | string (datetime) | Date the code package was built |
| `engineVersion` | string | Fortify Static Code Analyzer engine version |
| `rulePackVersion` | string | Rule pack version(s) used during analysis |
| `fileCount` | integer | Number of files analyzed |
| `totalLinesOfCode` | integer | Total lines of code analyzed |
| `payLoadSize` | string | Size of the submitted payload (human-readable, e.g., `85,404.76 KB`) |
| `staticVulnerabilityFilter` | string \| null | Vulnerability filter applied, if any |
| `includeFortifyAviator` | boolean | Whether Fortify Aviator AI review was requested |
| `fortifyAviatorError` | string \| null | Error message if Aviator processing failed; null on success |

#### `dynamicScanSummaryDetails`

Returned by `fod dast-scan get` for Dynamic (DAST) scans. Null when no dynamic scan was performed.

| Field | Type | Description |
|-----|-----|-----|
| `dynamicSiteURL` | string \| null | Target URL (null for API scans using a collection) |
| `dynamicScanEnvironmentFacingType` | string | `Internal` or `External` — network accessibility of target |
| `isWebService` | boolean | Whether the target is a web service / API |
| `webServiceType` | string \| null | API definition type, e.g., `PostmanCollectionURL`, `OpenAPI` |
| `hasFormsAuthentication` | boolean | Form-based authentication configured |
| `requiresNetworkAuthentication` | boolean | Network-level authentication required |
| `allowFormSubmissions` | boolean | Forms may be submitted during crawl |
| `allowSameHostRedirects` | boolean | Redirects to same host are followed |
| `restrictToDirectoryAndSubdirectories` | boolean | Scan scope restricted to starting directory |
| `userAgentType` | string | `Desktop` or `Mobile` |
| `timeZone` | string | Time zone for scheduled/availability restrictions |
| `hasAvailabilityRestrictions` | boolean | Scan has time-window restrictions |
| `concurrentRequestThreadsType` | string | Crawl aggressiveness: `Standard` or `Aggressive` |
| `policyName` | string | Scan policy applied (e.g., `API`, `Standard`) |
| `elapsedTimeSpan` | string | Total scan duration (e.g., `"00:04:45"`) |
| `timeBoxInHours` | integer \| null | Maximum scan duration cap, if set |
| `crawlSessions` | integer | Number of crawl sessions completed |
| `failedRequests` | integer | Requests that failed during scan |
| `logouts` | integer | Number of session logouts detected |
| `macroPlaybacks` | integer | Number of login macro executions |
| `requestCall` | boolean | Whether a request callback was configured |
| `notes` | string \| null | User-supplied notes |

#### `mobileScanSummaryDetails`

Returned by `fod mast-scan get` for Mobile (MAST) scans. Null when no mobile scan was performed.

| Field | Type | Description |
|-----|-----|-----|
| `frameworkType` | string | Mobile framework: `iOS`, `Android`, `React Native`, etc. |
| `platformType` | string | Target platform: `iOS`, `Android`, or `Both` |
| `identifier` | string | App bundle ID or package name (e.g., `com.example.app`) |
| `version` | string | App version string |
| `auditPreferenceType` | string | `Automated` or `Manual` |
| `userAccountsRequried` | boolean | App requires user accounts (note: API-level typo in field name) |
| `accessToWebServices` | boolean | App accesses web services |
| `hasExclusions` | boolean | Certain areas excluded from analysis |
| `hasAvailabilityRestrictions` | boolean | Scan has time-window restrictions |

---

## Issues (Vulnerabilities)

### 🔑 Issue Identity & Correlation (Critical)

| Field | Type | Description |
|-----|-----|-----|
| `instanceId` | string | **Stable identifier for correlating the same issue across scans, releases, and applications** |
| `id` | integer | Scan-specific issue record ID |
| `vulnId` | string (UUID) | Logical vulnerability identifier |
| `checkId` | string (UUID) | Fortify rule identifier |

---

### Severity, Status & Lifecycle

| Field | Type | Description |
|-----|-----|-----|
| `severity` | integer | Numeric severity (see mapping below) |
| `severityString` | string | `Critical`, `High`, `Medium`, `Low`, `Info`, `Best_Practice` |

**Severity integer → string mapping:**

| `severity` | `severityString` |
|---|---|
| `4` | `Critical` |
| `3` | `High` |
| `2` | `Medium` |
| `1` | `Low` |
| `-1` | `Best_Practice` |
| `-2` | `Info` |
| `status` | string | `New`, `Existing`, `Reopened`, `Fixed` |
| `closedStatus` | boolean | Issue closed |
| `closedDate` | string (datetime) \| null | Closure timestamp |
| `introducedDate` | string (date) | First detection date |
| `timeToFixDays` | integer \| null | Days from introduction to closure (computed; null if open) |

**Note:** `timeToFixDays` is a derived, reporting-only metric and should not be used
for correlation, prioritization, or policy logic.

---

### Classification & Location

| Field | Type | Description |
|-----|-----|-----|
| `category` | string | Vulnerability category (e.g., XML External Entity Injection) |
| `kingdom` | string | Fortify taxonomy |
| `package` | string \| null | Library or component context for the finding (e.g., `Java J2EE JAXP`) |
| `analysisType` | string | Analysis variant or sub-method; often `"(Not Set)"` for SAST findings |
| `subtype` | string \| null | Optional subtype |
| `primaryLocation` | string | Source filename |
| `primaryLocationFull` | string | Full source path |
| `lineNumber` | integer | Line number |
| `location` | string | `file:line` shorthand |
| `source` | string | Dataflow source |
| `sink` | string | Dataflow sink |

---

### Scan & Release Association

| Field | Type | Description |
|-----|-----|-----|
| `releaseId` | integer | Release the issue belongs to |
| `scanId` | integer | Scan detecting the issue |
| `scanType` / `scantype` | string | `Static`, `Dynamic`, `Mobile`, `OpenSource` |
| `scanStartedDate` | string (datetime) | Scan start |
| `scanCompletedDate` | string (datetime) | Scan completion |

---

### Workflow, Audit & Collaboration

| Field | Type | Description |
|-----|-----|-----|
| `developerStatus` | string | Developer workflow state |
| `auditorStatus` | string | Auditor disposition |
| `auditPendingAuditorStatus` | string | Pending audit status |
| `auditPendingSuppression` | string \| null | Pending suppression |
| `assignedUser` | string | Issue assignee |
| `hasComments` | boolean | Comments exist |
| `hasAttachments` | boolean | Attachments exist |

---

### Suppression, Bugs & Visibility

| Field | Type | Description |
|-----|-----|-----|
| `isSuppressed` | boolean | Issue suppressed |
| `suppressedBy` | string \| null | Suppressor |
| `falsePositiveChallenge` | string | FP challenge indicator |
| `bugSubmitted` | boolean | Bug tracker issue exists |
| `bugLink` | string | Bug tracker URL |
| `visibility` | string | Visibility state |
| `visibilityMarker` | string | UI marker |

---

## Developer Status (Default Values)

Developer Status represents **engineering workflow state**. Developer status indicates whether an issue is considered `open` or `closed` for reporting purposes. It does **not** suppress issues or change policy results. All tenants have a set of deafult values but can be customized.

- All new issues are assigned to `Open`
- Default **open** statuses: `Open`, `In Remediation`
- Default **closed** statuses:  `Remediated`, `Will Not Fix`, `Third Party Component`


---

## Auditor Status (Default Values & Suppression Semantics)

Auditor Status represents **security authority decisions** and is the **authoritative control for suppression behavior.**  All tenants have a set of default values but can be customized.

- All new issues are assigned to `Pending Review`
- Default **suppressing** statuses: `Pending Review`, `Not an Issue`, `Risk Accepted`
- Default **non-suppressing** statuses:  `Remediation Required`, `Remediation Deferred`, `Risk Mitigated`

---

## Fortify Aviator (AI-Assisted Audit & Remediation)

Fortify Aviator is Fortify’s AI-based review and remediation system.

| Field | Type | Description |
|-----|-----|-----|
| `fortifyAviator` | boolean | Issue reviewed by Aviator |
| `aviatorRemediationGuidanceAvailable` | boolean | AI remediation available |

**Semantics:**
- Aviator-reviewed issues are **high-confidence true positives**
- Aviator may validate findings and suggest secure fixes
- Suitable for automation and prioritization

---

## Terminology Equivalencies

| Fortify Term | Equivalent Industry Term |
|-------------|--------------------------|
| Static Scan | SAST (Static Application Security Testing) |
| Dynamic Scan | DAST (Dynamic Application Security Testing) |
| Open Source Scan | SCA (Software Composition Analysis) |
| Mobile Scan | Mobile AppSec Testing |
| Issue | Vulnerability / Finding |

---

## Compliance & Standards Mappings (Summary)

FoD issues may include multiple compliance-related fields.
The exact set may vary over time and by tenant.

Common examples:
- `cwe`
- `owasp2017`, `owasp2021`, `owasp2023`
- `nistsp800_53rev5`
- `pci401`
- `fisma`
- `stig*`

These fields are informational and do not affect correlation or policy decisions.

---

## Issue Identity & Deduplication Guidance

- **Always use `instanceId` as the canonical vulnerability key**
- Do **not** use `id` for deduplication
- Recommended fallback (if needed):

```

checkId + primaryLocationFull + lineNumber

```

---

## Identifier vs Display Field Pairs

Some application fields are returned as both an ID and a display string.

Common examples:
- `businessCriticalityTypeId` + `businessCriticalityType`
- `applicationTypeId` + `applicationType`
- `sdlcStatusTypeId` + `sdlcStatusType`

**Guidance:**
- Use the string value for explanation and reasoning
- Use the ID value only for follow-on API calls

## Recommended Usage for AI Agents

- Prefer string fields for explanations
- Use IDs only for follow-on API calls
- Treat Auditor Status as authoritative for suppression
- Treat Aviator-reviewed issues as high-confidence
- Use `instanceId` for correlation and deduplication
```

***

## fcli fod Modules

| Module | Alias | Purpose |
|--------|-------|---------|
| `session` | | Authentication (login/logout) |
| `app` | | Manage applications |
| `release` | `rel` | Manage releases |
| `microservice` | `ms` | Manage microservices |
| `issue` | | Vulnerabilities / findings |
| `sast-scan` | `sast` | Static (SAST) scans |
| `dast-scan` | `dast` | Dynamic (DAST) scans |
| `oss-scan` | `oss` | Open source / SCA scans |
| `mast-scan` | `mast` | Mobile (MAST) scans |
| `report` | | Reports |
| `access-control` | `ac` | Users & groups |
| `attribute` | `attr` | Tenant attributes |
| `action` | | Built-in/custom automation actions |
| `rest` | | Direct REST API passthrough |

Use `fcli fod <module> -h` to explore sub-commands for any module.

