# Fortify SSC / fcli Returned Values Reference (ssc module)

This document summarizes fields returned by the **Fortify CLI (fcli) `ssc` module**
when interacting with **Fortify Software Security Center (SSC / OpenText Application Security Center)**.

Field names and values reflect what is returned by common fcli commands such as:
- `fcli ssc app get` / `fcli ssc app list`
- `fcli ssc appversion get` / `fcli ssc appversion list`
- `fcli ssc artifact get` / `fcli ssc artifact list`
- `fcli ssc issue list` / `fcli ssc issue count`
- `fcli ssc attr list`
- `fcli ssc issue list-filtersets`
- `fcli ssc pi list` / `fcli ssc var list`

## Table of Contents
- [SSC Terminology vs. FoD](#ssc-terminology-vs-fod)
- [General / Common Fields](#general--common-fields)
- [Applications](#applications)
- [Application Versions](#application-versions) — Core Metadata, Version State (`currentState`)
- [Artifacts](#artifacts) — Core Fields, Embedded Scan Records
- [Issues (Vulnerabilities)](#issues-vulnerabilities) — Identity & Correlation, Severity & Priority, Classification & Location, Scan & Version Association, Lifecycle & Status, Visibility & Suppression, Audit & Workflow, Bug Tracking
- [Issue Count Data](#issue-count-data)
- [Filter Sets](#filter-sets)
- [Attributes](#attributes)
- [Performance Indicators](#performance-indicators)
- [Variables](#variables)
- [Users / Access Control](#users--access-control)
- [fcli ssc Modules](#fcli-ssc-modules)
- [Identifier vs. Display Field Pairs](#identifier-vs-display-field-pairs)
- [Recommended Usage for AI Agents](#recommended-usage-for-ai-agents)

---

## SSC Terminology vs. FoD

| SSC Term | FoD Equivalent | Notes |
|---|---|---|
| Application | Application | Same concept |
| Application Version | Release | SSC uses "version"; FoD uses "release" |
| Artifact | (no direct equivalent) | FPR file uploaded to SSC containing scan results |
| Issue | Issue / Vulnerability | Same concept |
| Filter Set | (no direct equivalent) | Rulesets that determine how issues are grouped into folders |
| Folder | (implicit in severity) | Named buckets within a filter set (e.g., Critical, High) |
| Custom Tag | (no direct equivalent) | FoD has fixed audit fields (e.g., Analysis, Developer Status) |
| Performance Indicator | (no direct equivalent) | Computed percentage metrics (e.g., % Critical Audited) |
| Variable | (no direct equivalent) | Tenant-defined numeric metrics derived from issue counts |
| Project | Application | Legacy name for Application; still appears in some API fields |

---

## General / Common Fields

| Field | Type | Description |
|---|---|---|
| `id` | integer or string | Object identifier. String for performance indicators and variables. |
| `_href` | string | Self-link to the REST API resource |
| `creationDate` | string (datetime) | Creation timestamp (ISO 8601 with timezone offset) |
| `createdBy` | string | Username of the creator |

---

## Applications

Applications are the top-level organizational unit in SSC. Each application can have multiple versions.

| Field | Type | Description |
|---|---|---|
| `id` | integer | Unique application identifier |
| `name` | string | Application name |
| `description` | string | Optional description |
| `creationDate` | string (datetime) | Application creation timestamp |
| `createdBy` | string | Username of creator |
| `issueTemplateId` | string \| null | ID of the issue template assigned to the application |

**Note:** "Project" appears in raw REST API paths (`/api/v1/projects/`) and a few legacy ID-only output fields (e.g., `projectVersionId` on artifacts and issues). It is **not** the field name in fcli `--query` expressions or in fcli output objects. In `appversion` records the parent application is exposed as the `application` object — query it as `application.name`, `application.id`, etc. **Never use `project.name` in an fcli `--query`** — it does not match.

---

## Application Versions

Application Versions are the primary unit of analysis in SSC. Scan results, issues, attributes, and metrics are all associated with a version.

### Core Version Metadata

| Field | Type | Description |
|---|---|---|
| `id` | integer | Unique application version identifier |
| `name` | string | Version name (e.g., `main`, `1.0`, `release-2.1`) |
| `description` | string | Optional description |
| `createdBy` | string | Username of creator |
| `creationDate` | string (datetime) | Version creation timestamp |
| `application` | object | Embedded parent application object (see Application fields) |
| `committed` | boolean | Whether the version has been committed (enabled for use) |
| `active` | boolean | Whether the version is active (not retired) |
| `issueTemplateId` | string | Assigned issue template ID |
| `issueTemplateName` | string | Human-readable issue template name |
| `staleIssueTemplate` | boolean | Issue template has been updated since last applied |
| `serverVersion` | number | SSC server version at time of version creation |
| `mode` | string | Analysis mode: `BASIC` (standard) or `ADVANCED` |
| `owner` | string | Version owner username (may be empty) |
| `bugTrackerPluginId` | string \| null | Bug tracker plugin ID if configured |
| `bugTrackerEnabled` | boolean | Whether bug tracking integration is enabled |
| `securityGroup` | string \| null | Security group applied to this version |
| `status` | string \| null | Optional status label (e.g., `ACTIVE`); tenant-configurable |
| `assignedIssuesCount` | integer | Number of issues currently assigned to users |
| `customTagValuesAutoApply` | boolean \| null | Whether custom tag values are auto-applied by Audit Assistant |
| `autoPredict` | boolean \| null | Whether Audit Assistant auto-prediction is enabled |
| `predictionPolicy` | string | Audit Assistant prediction policy name |
| `auditAssistantTrainingCustomTagGuid` | string | GUID of the custom tag used for AA training |
| `dataRetentionPolicyOverride` | boolean | Whether data retention policy is overridden for this version |
| `masterAttrGuid` | string | GUID of the master attribute definition set |
| `obfuscatedId` | string \| null | Obfuscated version ID (used in some legacy contexts) |
| `siteId` | string \| null | Site identifier (used in multi-site deployments) |
| `latestScanId` | integer \| null | ID of the most recent scan (may be null if not indexed) |
| `sourceBasePath` | string \| null | Base path override for source file display |
| `loadProperties` | object \| null | Additional load properties |
| `migrationVersion` | string \| null | Version migration marker |

### Version State (`currentState`)

The `currentState` object reflects the live health and analysis status of the version.

| Field | Type | Description |
|---|---|---|
| `id` | integer | Matches the version ID |
| `committed` | boolean | Version is committed |
| `attentionRequired` | boolean | Version requires manual attention (e.g., processing errors) |
| `analysisResultsExist` | boolean | At least one scan has been successfully processed |
| `auditEnabled` | boolean | Auditing is enabled for this version |
| `lastFprUploadDate` | string (datetime) \| null | Timestamp of most recent FPR artifact upload |
| `extraMessage` | string \| null | Additional status message |
| `analysisUploadEnabled` | boolean | New scan results can be uploaded |
| `batchBugSubmissionExists` | boolean | A batch bug submission is pending |
| `hasCustomIssues` | boolean | Version contains manually-created custom issues |
| `metricEvaluationDate` | string (datetime) \| null | Timestamp of most recent metric evaluation |
| `deltaPeriod` | integer | Number of days used for delta/trend metric calculations |
| `issueCountDelta` | integer | Change in total issue count over the delta period |
| `percentAuditedDelta` | number | Change in overall audit percentage over the delta period |
| `criticalPriorityIssueCountDelta` | integer | Change in critical issue count over the delta period |
| `percentCriticalPriorityIssuesAuditedDelta` | number | Change in critical audit percentage over the delta period |

---

## Artifacts

Artifacts represent uploaded scan result files (FPR format). Each artifact contains one or more embedded scan records.

### Core Artifact Fields

| Field | Type | Description |
|---|---|---|
| `id` | integer | Unique artifact identifier |
| `artifactType` | string | Always `FPR` for standard Fortify result files |
| `status` | string | Processing status (see below) |
| `uploadDate` | string (datetime) | When the artifact was uploaded to SSC |
| `lastScanDate` | string (datetime) | Date of the most recent scan within this artifact |
| `fileName` | string | Internal storage filename assigned by SSC |
| `originalFileName` | string | Original filename provided at upload |
| `fileSize` | integer | File size in bytes |
| `fileURL` | string \| null | Download URL (if available) |
| `uploadIP` | string | IP address of the upload source |
| `userName` | string | Username of the uploader |
| `projectVersionId` | integer | ID of the application version this artifact belongs to |
| `purged` | boolean | Whether artifact data has been purged |
| `indexed` | boolean | Whether artifact has been indexed for search |
| `auditUpdated` | boolean | Whether audit data in the artifact was applied to the version |
| `messageCount` | integer | Number of processing messages |
| `messages` | string | Processing messages (warnings, info notes) |
| `scanErrorsCount` | integer | Number of scan errors logged during processing |
| `scanTypes` | string | Comma-separated list of scan types in this artifact (e.g., `SCA`, `WEBINSPECT`, `SCA, WEBINSPECT`) |
| `allowDelete` | boolean | Current user may delete this artifact |
| `allowPurge` | boolean | Current user may purge this artifact |
| `allowApprove` | boolean | Current user may approve this artifact |
| `inModifyingStatus` | boolean | Artifact is currently being modified |
| `versionNumber` | string \| null | Optional version label |
| `approvalComment` | string \| null | Comment left at approval |
| `approvalDate` | string (datetime) \| null | Approval timestamp |
| `approvalUsername` | string \| null | Approving user |

**Artifact Processing Status Values:**

| `status` | Meaning |
|---|---|
| `PROCESS_COMPLETE` | Artifact processed successfully |
| `PROCESSING` | Currently being processed |
| `REQUIRE_AUTH` | Requires approval before processing |
| `ERROR_PROCESSING` | Processing failed |
| `SCHED_PROCESSING` | Queued for processing |
| `PURGED` | Artifact data purged |

**Artifact Sub-Status Fields (per result type):**

| Field | Values | Description |
|---|---|---|
| `scaStatus` | `PROCESSED`, `IGNORED`, `NOT_EXIST`, `PROCESSING`, `ERROR` | Status of SCA (SAST) scan data within this artifact |
| `webInspectStatus` | `PROCESSED`, `IGNORED`, `NOT_EXIST`, `PROCESSING`, `ERROR`, `NONE` | Status of WebInspect (DAST) scan data within this artifact |
| `runtimeStatus` | `PROCESSED`, `NONE`, `NOT_EXIST` | Status of runtime agent scan data |
| `otherStatus` | `PROCESSED`, `NOT_EXIST` | Status of other (third-party parser) scan data |

### Embedded Scan Records (`_embed.scans`)

Each artifact embeds an array of scan records from the FPR file.

| Field | Type | Description |
|---|---|---|
| `id` | integer | Unique scan record identifier |
| `guid` | string | Scan GUID (may be a UUID or URN) |
| `uploadDate` | string (datetime) | When this scan was processed |
| `type` | string | Scan engine type: `SCA`, `WEBINSPECT`, `DEBRICKED` |
| `certification` | string | Certification status: `VALID`, `NOT_PRESENT`, `INVALID` |
| `hostname` | string | Hostname of the scan engine (or target URL for DAST) |
| `engineVersion` | string | Version of the scan engine |
| `artifactId` | integer | ID of the parent artifact |
| `noOfFiles` | integer | Number of files analyzed (SAST only) |
| `totalLOC` | integer | Total lines of code analyzed (SAST only) |
| `execLOC` | integer | Executable lines of code analyzed (SAST only) |
| `elapsedTime` | string | Scan duration in `HH:MM` format |
| `fortifyAnnotationsLOC` | integer | Lines containing Fortify audit annotations |
| `buildId` | string | Build identifier |
| `buildLabel` | string | Build label (DAST scans) |
| `rulepacks` | array | Rule packs used during analysis (SAST only) |

**Rulepack entry fields:**

| Field | Type | Description |
|---|---|---|
| `guid` | string | Rulepack GUID |
| `name` | string | Rulepack display name |
| `version` | string | Rulepack version |

---

## Issues (Vulnerabilities)

### Issue Identity & Correlation

| Field | Type | Description |
|---|---|---|
| `issueInstanceId` | string | **Stable identifier for correlating the same issue across scans** (32-character hex string) |
| `id` | integer | Database-specific issue record ID; changes when issues are re-processed |
| `primaryRuleGuid` | string (UUID) | GUID of the Fortify rule that detected this issue |

**Always use `issueInstanceId` as the canonical issue key.** Do not use `id` for deduplication or correlation.

### Severity & Priority

SSC uses a computed **Fortify Priority Order** (FPO) to bucket issues into named folders. FPO is derived from `impact` × `likelihood` calculations, not a single severity field.

| Field | Type | Description |
|---|---|---|
| `friority` | string | **Fortify Priority Order**: `Critical`, `High`, `Medium`, `Low` — this is the primary bucketing used in the UI (note: field name has historical typo) |
| `enginePriority` | string | Engine-computed priority before filter adjustments; usually matches `friority` |
| `severity` | number (float) | Raw severity score (0.0–5.0); used in FPO calculation; not directly mapped to string severities |
| `impact` | number (float) | Impact score (0.0–5.0) |
| `likelihood` | number (float) | Likelihood score (0.0–5.0) |
| `confidence` | number (float) | Confidence score (0.0–5.0) |
| `folderName` | string | Name of the filter set folder this issue is placed in (e.g., `Critical`, `High`, `Medium`, `Low`) |
| `folderId` | integer | Numeric folder ID within the active filter set |
| `folderGuid` | string | GUID of the filter set folder |

### Classification & Location

| Field | Type | Description |
|---|---|---|
| `issueName` | string | **Full issue category**; format is `"Category: Subcategory"` or just `"Category"` when no subcategory exists |
| `kingdom` | string | Fortify vulnerability taxonomy kingdom (e.g., `Input Validation and Representation`, `Security Features`) |
| `analyzer` | string | Analysis technique: `Data Flow`, `Structural`, `Control Flow`, `Configuration`, `Content`, `Semantic` |
| `engineType` | string | Scan engine: `SCA` (SAST), `WEBINSPECT` (DAST), `DEBRICKED` (OSS) |
| `displayEngineType` | string | Display name for engine type; usually matches `engineType` |
| `engineCategory` | string | Category of engine: `STATIC`, `DYNAMIC` |
| `primaryLocation` | string | Source file name (short form) |
| `fullFileName` | string | Full relative path to the source file |
| `lineNumber` | integer | Line number of the primary finding location |
| `location` | string | Shorthand `file:line` string |

### Scan & Version Association

| Field | Type | Description |
|---|---|---|
| `projectVersionId` | integer | Application version this issue belongs to |
| `lastScanId` | integer | ID of the most recent scan that observed this issue |

### Lifecycle & Status

| Field | Type | Description |
|---|---|---|
| `scanStatus` | string | Scan delta status: `NEW`, `UPDATED`, `REINTRODUCED` |
| `foundDate` | string (datetime) | When this issue was first detected |
| `removedDate` | string (datetime) \| null | When this issue was marked as removed (no longer found in latest scan) |
| `revision` | integer | Number of times this issue has been re-detected across scans |

### Visibility & Suppression

| Field | Type | Description |
|---|---|---|
| `visibility` | string | Current visibility state: `visible`, `suppressed`, `removed`, `hidden` |
| `visibilityMarker` | string | Short marker: ` ` (visible), `(S)` (suppressed), `(R)` (removed) |
| `suppressed` | boolean | Issue has been suppressed (auditor decision) |
| `removed` | boolean | Issue is no longer found in the most recent scan |
| `hidden` | boolean | Issue is hidden by an active filter |

**Visibility note:** By default, `fcli ssc issue list` returns only `visible` issues. Use `--include=suppressed,removed,hidden` to include other states.

### Audit & Workflow

| Field | Type | Description |
|---|---|---|
| `audited` | boolean | Whether the issue has been reviewed by a human auditor |
| `issueStatus` | string | Audit status: `Unreviewed`, `Reviewed` |
| `primaryTag` | string \| null | Value of the primary custom tag (e.g., `Analysis`, `Not an Issue`, `Reliability Issue`) |
| `primaryTagValueAutoApplied` | boolean | Whether the primary tag value was applied by Audit Assistant |
| `reviewed` | object \| null | Audit review detail (typically null in list output) |
| `hasComments` | boolean | Whether any comments have been added to this issue |
| `hasAttachments` | boolean | Whether any attachments have been added |
| `hasCorrelatedIssues` | boolean | Whether this issue has correlated issues (SAST/DAST correlation) |
| `correlatedIssueIdsAsSource` | array | Issue IDs where this issue is the SAST source in a SAST/DAST correlation |
| `correlatedIssueIdsAsTarget` | array | Issue IDs where this issue is the DAST target in a SAST/DAST correlation |

### Bug Tracking

| Field | Type | Description |
|---|---|---|
| `bugURL` | string \| null | URL of the linked bug tracker issue |
| `externalBugId` | string \| null | External bug ID in the bug tracker |

---

## Issue Count Data

Returned by `fcli ssc issue count --av=<appVersionNameOrId>`.

Issue counts are grouped by **filter set folder** (default: Security Auditor View folders).

| Field | Type | Description |
|---|---|---|
| `id` | string | Folder name used as identifier (e.g., `Critical`, `High`) |
| `cleanName` | string | Display name of the folder |
| `name` | string | Formatted label including counts: `"Critical - [audited / total]"` |
| `totalCount` | integer | Total number of issues in this folder |
| `auditedCount` | integer | Number of audited issues in this folder |
| `visibleCount` | integer | Number of visible (not suppressed/removed) issues in this folder |

---

## Filter Sets

Filter sets control how issues are organized into priority folders. Each application version has one or more filter sets; one is the default.

Returned by `fcli ssc issue list-filtersets --av=<appVersionNameOrId>`.

| Field | Type | Description |
|---|---|---|
| `guid` | string | Unique filter set identifier |
| `title` | string | Filter set display name |
| `description` | string | Filter set description |
| `defaultFilterSet` | boolean | Whether this is the active default filter set for the version |
| `folders` | array | List of folder definitions in this filter set |

**Folder entry fields:**

| Field | Type | Description |
|---|---|---|
| `id` | integer | Folder ID (used in issue `folderId` field) |
| `guid` | string | Folder GUID (used in issue `folderGuid` field) |
| `name` | string | Folder name (e.g., `Critical`, `High`, `Medium`, `Low`) |
| `color` | string | Hex color code for UI display |

**Standard Filter Sets:**

| Name | Description |
|---|---|
| `Security Auditor View` | Default; classic four-folder layout (Critical, High, Medium, Low) |
| `Quick View` | Focuses on high-impact/high-likelihood issues only |
| `Audit Assistant` | Groups by AA prediction: Not an Issue, Exploitable, Indeterminate, Not predicted |

---

## Attributes

Attributes are tenant-defined metadata fields attached to application versions. They provide business and technical context.

Returned by `fcli ssc attr list --av=<appVersionNameOrId>`.

| Field | Type | Description |
|---|---|---|
| `id` | integer | Attribute record ID on this version |
| `guid` | string | Attribute definition GUID (may be a name string or UUID) |
| `name` | string | Attribute display name |
| `category` | string | Attribute category: `BUSINESS`, `TECHNICAL`, `ORGANIZATION` |
| `attributeDefinitionId` | integer | ID of the global attribute definition |
| `value` | string \| null | Free-text value (for text-type attributes) |
| `values` | array | Selected values (for option-type attributes) |
| `valueString` | string | Human-readable summary of the current value(s) |

**Value entry fields (for option-type attributes):**

| Field | Type | Description |
|---|---|---|
| `guid` | string | Option GUID |
| `name` | string | Option display name |
| `description` | string | Option description |
| `hidden` | boolean | Whether this option is hidden in the UI |
| `inUse` | boolean | Whether this option is currently selected |
| `index` | integer | Display sort order |

**Common built-in attribute definitions:**

| `guid` | `name` | Category | Type |
|---|---|---|---|
| `DevPhase` | Development Phase | TECHNICAL | Option |
| `DevStrategy` | Development Strategy | TECHNICAL | Option |
| `Accessibility` | Accessibility | TECHNICAL | Option |
| `ProjectType` | Application Type | TECHNICAL | Option |
| `TargetPlatform` | Target Deployment Platform | TECHNICAL | Option |
| `Interfaces` | Interfaces | TECHNICAL | Option (multi-select) |
| `Languages` | Development Languages | TECHNICAL | Option (multi-select) |
| `AuthenticationSystem` | Authentication System | TECHNICAL | Option |
| `BusinessRisk` | Business Risk | BUSINESS | Option |
| `Compliance` | Known Compliance Obligations | BUSINESS | Text |
| `InfoClassification` | Data Classification | BUSINESS | Option |

---

## Performance Indicators

Performance Indicators are pre-defined percentage metrics computed from issue counts and audit state.

Returned by `fcli ssc pi list --av=<appVersionNameOrId>`.

| Field | Type | Description |
|---|---|---|
| `id` | string | Performance indicator identifier (name-based) |
| `name` | string | Display name |
| `description` | string | Description of what is measured |
| `value` | number | Computed value (percentage as a decimal, e.g., `74.68` = 74.68%) |
| `range` | string | Value type: `percent` |
| `timestamp` | string (datetime) | When this metric was last evaluated |
| `valueString` | string | Formatted value with units (e.g., `"74.68%"`) |

**Common built-in performance indicators:**

| `id` | Description |
|---|---|
| `PercentCriticalPriorityIssues` | % of all issues in the Critical folder |
| `PercentCriticalPriorityIssuesAudited` | % of Critical issues that are audited |
| `PercentHighPriorityIssuesAudited` | % of High issues that are audited |
| `PercentMediumPriorityIssuesAudited` | % of Medium issues that are audited |
| `PercentLowPriorityIssuesAudited` | % of Low issues that are audited |
| `PercentIssuesAudited` | % of all issues that are audited |

---

## Variables

Variables are tenant-defined numeric metrics derived from issue counts and other data. They are building blocks for custom KPIs and dashboard widgets.

Returned by `fcli ssc var list --av=<appVersionNameOrId>`.

| Field | Type | Description |
|---|---|---|
| `id` | string | Variable identifier |
| `name` | string | Display name |
| `value` | number | Computed numeric value |
| `timestamp` | string (datetime) | When this metric was last evaluated |

**Common built-in variables (default issue template):**

| `id` | Typical Meaning |
|---|---|
| `P0` | Critical priority issue count |
| `P1` | High priority issue count |
| `P2` | Medium priority issue count |
| `P3` | Low priority issue count |

Variable definitions are issue-template-specific and may differ across tenants.

---

## Users / Access Control

Returned by `fcli ssc access-control list-users`.

| Field | Type | Description |
|---|---|---|
| `id` | integer | User identifier |
| `entityName` | string | Login/username |
| `displayName` | string | Full display name |
| `firstName` | string | First name |
| `lastName` | string | Last name |
| `email` | string | Email address |
| `type` | string | Entity type: `User`, `Group` |
| `isLdap` | boolean | Whether this is an LDAP-sourced user |
| `ldapDn` | string \| null | LDAP distinguished name |

**Embedded role fields (`_embed.roles`):**

| Field | Type | Description |
|---|---|---|
| `name` | string | Role name (e.g., `Administrator`, `Security Lead`, `Developer`, `Manager`) |
| `allApplicationRole` | boolean | Whether this role applies globally to all applications |

---

## fcli ssc Modules

| Module | Alias | Purpose |
|---|---|---|
| `session` | | Authentication (login/logout) |
| `app` | | Manage applications |
| `appversion` | `av` | Manage application versions |
| `artifact` | | Manage artifacts (uploaded FPR files) |
| `issue` | | Issues (vulnerabilities), filter sets, filters, groups |
| `attribute` | `attr` | Application version attributes & definitions |
| `custom-tag` | `tag` | Custom audit tags |
| `access-control` | `ac` | Users, roles & tokens |
| `report` | | Reports & templates |
| `issue-template` | | Issue templates |
| `performance-indicator` | `pi` | Performance indicators & definitions (PREVIEW) |
| `variable` | `var` | Variables & definitions (PREVIEW) |
| `alert` | | Alerts & definitions |
| `plugin` | | Parser & bug tracker plugins |
| `system-state` | `state` | System state, logs, jobs |
| `action` | | Built-in/custom automation actions |
| `rest` | | Direct REST API passthrough |

Use `fcli ssc <module> -h` to explore sub-commands for any module.

---

## Identifier vs. Display Field Pairs

Some fields are returned as both an ID and a display string.

| ID Field | Display Field |
|---|---|
| `folderId` | `folderName` |
| `issueTemplateId` | `issueTemplateName` |
| `projectVersionId` | (use `application.name` + `name` for display) |
| `attributeDefinitionId` | `name` (on the attribute record) |

**Guidance:**
- Use string/display fields for human-readable explanation and reasoning
- Use integer IDs only for API follow-on calls

---

## Recommended Usage for AI Agents

- Use `issueInstanceId` for issue correlation and deduplication — never use `id`
- Use `friority` (not `severity`) for human-readable priority; it maps to the folder buckets used in the SSC UI
- Use `folderName` to present issue severity categories to users (Critical, High, Medium, Low)
- `suppressed == true` means a human auditor has determined the issue is not exploitable or not relevant; treat similarly to FoD's "Not an Issue" audit status
- `removed == true` means the issue was not found in the most recent scan; it is not the same as resolved/fixed
- `audited == true` means a human has reviewed the issue (set a custom tag value); it does not indicate the disposition
- Use `fcli ssc issue count --av=<id>` to get summary counts per priority folder; it is more efficient than listing all issues and counting client-side
- Prefer `-o json` for all commands when post-processing is needed
- Attributes use a structured `values` array for option-type attributes and a `valueString` convenience field for display
- Performance Indicators and Variables are marked as PREVIEW; the command syntax may change in future fcli versions
