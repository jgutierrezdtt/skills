Sample output from various SSC get and list commands. All of these assume the use of json output with `-o json`. Other output options may not produce the full set of data.

Sensitive environment-specific data has been replaced with generic placeholders: application/version names, IDs, usernames, emails, and server hostnames.

---

**Application Data**

Sample output from `fcli ssc app get` and `fcli ssc app list`

```json
{
  "id" : 10001,
  "name" : "MyOrg/SampleWebApp",
  "description" : "A sample Java web application.",
  "creationDate" : "2022-10-25T14:27:47.201-04:00",
  "createdBy" : "admin_user",
  "issueTemplateId" : "Prioritized-HighRisk-Project-Template",
  "_href" : "https://ssc.example.com/api/v1/projects/10001"
}
```

---

**Application Version Data**

Sample output from `fcli ssc appversion get` and `fcli ssc appversion list`

```json
{
  "id" : 20001,
  "application" : {
    "id" : 10001,
    "name" : "MyOrg/SampleWebApp",
    "description" : "A sample Java web application.",
    "creationDate" : "2022-10-25T14:27:47.201-04:00",
    "createdBy" : "admin_user",
    "issueTemplateId" : "Prioritized-HighRisk-Project-Template"
  },
  "name" : "main",
  "description" : "",
  "createdBy" : "admin_user",
  "creationDate" : "2022-10-25T14:27:47.203-04:00",
  "sourceBasePath" : null,
  "committed" : true,
  "issueTemplateId" : "Prioritized-HighRisk-Project-Template",
  "issueTemplateName" : "Prioritized High Risk Issue Template",
  "loadProperties" : null,
  "staleIssueTemplate" : false,
  "snapshotOutOfDate" : false,
  "refreshRequired" : false,
  "attachmentsOutOfDate" : false,
  "migrationVersion" : null,
  "masterAttrGuid" : "87f2364f-dcd4-49e6-861d-f8d3f351686b",
  "tracesOutOfDate" : false,
  "issueTemplateModifiedTime" : 1752674150911,
  "active" : true,
  "obfuscatedId" : null,
  "owner" : "",
  "serverVersion" : 25.2,
  "siteId" : null,
  "latestScanId" : null,
  "mode" : "BASIC",
  "currentState" : {
    "id" : 20001,
    "committed" : true,
    "attentionRequired" : false,
    "analysisResultsExist" : true,
    "auditEnabled" : true,
    "lastFprUploadDate" : "2025-11-12T00:14:07.617-05:00",
    "extraMessage" : null,
    "analysisUploadEnabled" : true,
    "batchBugSubmissionExists" : false,
    "hasCustomIssues" : false,
    "metricEvaluationDate" : "2025-11-12T00:14:10.168-05:00",
    "deltaPeriod" : 7,
    "issueCountDelta" : 0,
    "percentAuditedDelta" : 0.0,
    "criticalPriorityIssueCountDelta" : 0,
    "percentCriticalPriorityIssuesAuditedDelta" : 0.0
  },
  "bugTrackerPluginId" : null,
  "bugTrackerEnabled" : false,
  "securityGroup" : null,
  "status" : null,
  "assignedIssuesCount" : 0,
  "customTagValuesAutoApply" : true,
  "autoPredict" : true,
  "predictionPolicy" : "G2 Default Prediction Policy",
  "auditAssistantTrainingCustomTagGuid" : "",
  "dataRetentionPolicyOverride" : false,
  "_href" : "https://ssc.example.com/api/v1/projectVersions/20001"
}
```

---

**Artifact Data**

Artifacts encapsulate scan results uploaded to SSC. Each artifact embeds the scan(s) it contains.

Sample output from `fcli ssc artifact get` and `fcli ssc artifact list`

*SCA (SAST) Artifact*

```json
{
  "id" : 30001,
  "artifactType" : "FPR",
  "status" : "PROCESS_COMPLETE",
  "allowDelete" : true,
  "allowPurge" : false,
  "allowApprove" : false,
  "inModifyingStatus" : false,
  "uploadDate" : "2025-11-12T00:14:07.617-05:00",
  "approvalComment" : null,
  "approvalDate" : null,
  "approvalUsername" : null,
  "auditUpdated" : false,
  "messages" : "",
  "messageCount" : 0,
  "purged" : false,
  "fileName" : "6948753765661845196.fpr",
  "fileSize" : 2645438,
  "fileURL" : null,
  "originalFileName" : "SampleWebApp-main.fpr",
  "uploadIP" : "10.0.0.10",
  "userName" : "demo_user",
  "versionNumber" : null,
  "otherStatus" : "NOT_EXIST",
  "runtimeStatus" : "NONE",
  "scaStatus" : "PROCESSED",
  "webInspectStatus" : "NONE",
  "lastScanDate" : "2025-11-12T05:43:56-05:00",
  "scanErrorsCount" : 2,
  "indexed" : true,
  "projectVersionId" : 20001,
  "_embed" : {
    "scans" : [
      {
        "id" : 40001,
        "guid" : "008f0d02-9c58-4d3c-a0e3-35f72bcc80ae",
        "uploadDate" : "2025-11-12T05:43:56-05:00",
        "type" : "SCA",
        "certification" : "VALID",
        "hostname" : "scancentral-sast-worker-0",
        "engineVersion" : "25.2.0.0116",
        "artifactId" : 30001,
        "noOfFiles" : 753,
        "totalLOC" : 921101,
        "execLOC" : 921101,
        "elapsedTime" : "02:16",
        "fortifyAnnotationsLOC" : 0,
        "buildId" : "build-001",
        "rulepacks" : [
          {
            "guid" : "06A6CC97-8C3F-4E73-9093-3E74C64A2AAF",
            "name" : "Fortify Secure Coding Rules, Core, Java",
            "version" : "2025.2.0.0007"
          },
          {
            "guid" : "88D39959-D322-499A-87F3-BC9E1193B07A",
            "name" : "Fortify Secure Coding Rules, Core, Universal",
            "version" : "2025.2.0.0007"
          },
          {
            "guid" : "AAAC0B10-79E7-4FE5-9921-F4903A79D317",
            "name" : "Fortify Secure Coding Rules, Extended, Java",
            "version" : "2025.2.0.0007"
          },
          {
            "guid" : "BD292C4E-4216-4DB8-96C7-9B607BFD9584",
            "name" : "Fortify Secure Coding Rules, Core, JavaScript",
            "version" : "2025.2.0.0007"
          }
        ]
      }
    ]
  },
  "_href" : "https://ssc.example.com/api/v1/artifacts/30001",
  "scanTypes" : "SCA"
}
```

*WebInspect (DAST) Artifact*

```json
{
  "id" : 30002,
  "artifactType" : "FPR",
  "status" : "PROCESS_COMPLETE",
  "allowDelete" : true,
  "allowPurge" : false,
  "allowApprove" : false,
  "inModifyingStatus" : false,
  "uploadDate" : "2023-10-31T02:46:43-04:00",
  "approvalComment" : null,
  "approvalDate" : null,
  "approvalUsername" : null,
  "auditUpdated" : true,
  "messages" : "",
  "messageCount" : 0,
  "purged" : false,
  "fileName" : "12fb13c467d1471f82cc83f286ecddf9.fpr",
  "fileSize" : 3640611,
  "fileURL" : null,
  "originalFileName" : "Site._http.sampleapp.example.com_10-31-2023.fpr",
  "uploadIP" : "10.0.0.10",
  "userName" : "demo_user",
  "versionNumber" : null,
  "otherStatus" : "NOT_EXIST",
  "runtimeStatus" : "NONE",
  "scaStatus" : "NOT_EXIST",
  "webInspectStatus" : "PROCESSED",
  "lastScanDate" : "2023-10-31T02:46:43-04:00",
  "scanErrorsCount" : 0,
  "indexed" : true,
  "projectVersionId" : 20001,
  "_embed" : {
    "scans" : [
      {
        "id" : 40002,
        "uploadDate" : "2023-10-31T02:46:43-04:00",
        "type" : "WEBINSPECT",
        "certification" : "NOT_PRESENT",
        "hostname" : "http://sampleapp.example.com:8080/",
        "engineVersion" : "23.1",
        "artifactId" : 30002,
        "buildLabel" : "",
        "noOfFiles" : 0,
        "totalLOC" : 0,
        "execLOC" : 0,
        "elapsedTime" : "00:00",
        "fortifyAnnotationsLOC" : 0,
        "buildId" : ""
      }
    ]
  },
  "_href" : "https://ssc.example.com/api/v1/artifacts/30002",
  "scanTypes" : "WEBINSPECT"
}
```

*Debricked (SCA/OSS) Artifact*

```json
{
  "id" : 30003,
  "artifactType" : "FPR",
  "status" : "PROCESS_COMPLETE",
  "allowDelete" : true,
  "allowPurge" : false,
  "allowApprove" : false,
  "inModifyingStatus" : false,
  "uploadDate" : "2024-12-20T06:11:51.232-05:00",
  "approvalComment" : null,
  "approvalDate" : null,
  "approvalUsername" : null,
  "auditUpdated" : false,
  "messages" : "",
  "messageCount" : 0,
  "purged" : false,
  "fileName" : "3f2b7957487746aa995a2fe8cc764551.zip",
  "fileSize" : 156725,
  "fileURL" : null,
  "originalFileName" : "SBOM_2024-12-20_sbom.json",
  "uploadIP" : "10.0.0.10",
  "userName" : "demo_user",
  "versionNumber" : null,
  "otherStatus" : "PROCESSED",
  "runtimeStatus" : "NONE",
  "scaStatus" : "NOT_EXIST",
  "webInspectStatus" : "NONE",
  "lastScanDate" : "2024-12-20T04:28:05-05:00",
  "scanErrorsCount" : 0,
  "indexed" : true,
  "projectVersionId" : 20001,
  "_embed" : {
    "scans" : [
      {
        "id" : 40003,
        "guid" : "urn:uuid:a56fe0f5-deee-4825-b580-a8f585d16897",
        "uploadDate" : "2024-12-20T04:28:05-05:00",
        "type" : "DEBRICKED",
        "certification" : "NOT_PRESENT",
        "engineVersion" : "1.4",
        "artifactId" : 30003,
        "noOfFiles" : 302,
        "totalLOC" : 0,
        "elapsedTime" : "00:00",
        "fortifyAnnotationsLOC" : 0,
        "buildId" : ""
      }
    ]
  },
  "_href" : "https://ssc.example.com/api/v1/artifacts/30003",
  "scanTypes" : "DEBRICKED"
}
```

---

**Issue Data**

Sample output from `fcli ssc issue list`

*Visible Critical Issue (Data Flow / SAST)*

```json
{
  "projectVersionId" : 20001,
  "lastScanId" : 40001,
  "id" : 2499,
  "projectVersionName" : null,
  "projectName" : null,
  "revision" : 3,
  "folderId" : 216,
  "folderGuid" : "b968f72f-cc12-03b5-976e-ad4c13920c21",
  "issueInstanceId" : "D2A7806BEC05EE2CD1171AA38673F6AB",
  "issueName" : "Cross-Site Scripting: Persistent",
  "primaryLocation" : "ApiMessageController.java",
  "lineNumber" : 85,
  "fullFileName" : "src/main/java/com/microfocus/example/api/controllers/ApiMessageController.java",
  "analyzer" : "Data Flow",
  "kingdom" : "Input Validation and Representation",
  "friority" : "Critical",
  "enginePriority" : "Critical",
  "reviewed" : null,
  "bugURL" : null,
  "externalBugId" : null,
  "primaryTag" : "Reliability Issue",
  "hasAttachments" : false,
  "hasCorrelatedIssues" : false,
  "correlatedIssueIdsAsSource" : [],
  "correlatedIssueIdsAsTarget" : [],
  "hasComments" : true,
  "scanStatus" : "UPDATED",
  "foundDate" : "2022-11-11T17:48:24-05:00",
  "removedDate" : null,
  "engineType" : "SCA",
  "displayEngineType" : "SCA",
  "engineCategory" : "STATIC",
  "primaryRuleGuid" : "C5BAD00B-6C80-4412-B467-F378614D55CC",
  "impact" : 5.0,
  "likelihood" : 5.0,
  "severity" : 4.0,
  "confidence" : 5.0,
  "audited" : true,
  "issueStatus" : "Reviewed",
  "primaryTagValueAutoApplied" : false,
  "hidden" : false,
  "suppressed" : false,
  "removed" : false,
  "_href" : "https://ssc.example.com/api/v1/projectVersions/20001/issues/2499",
  "location" : "ApiMessageController.java:85",
  "visibility" : "visible",
  "visibilityMarker" : " ",
  "folderName" : "Critical"
}
```

*Visible Medium Issue (Content Analyzer / SAST)*

```json
{
  "projectVersionId" : 20001,
  "lastScanId" : 40001,
  "id" : 156028,
  "projectVersionName" : null,
  "projectName" : null,
  "revision" : 0,
  "folderId" : 218,
  "folderGuid" : "d5f55910-5f0d-a775-e91f-191d1f5608a4",
  "issueInstanceId" : "535B33FA5F043A661406DEFEED187CDE",
  "issueName" : "Insecure Transport: External Link",
  "primaryLocation" : "about.html",
  "lineNumber" : 17,
  "fullFileName" : "src/main/webapp/WEB-INF/views/about.html",
  "analyzer" : "Content",
  "kingdom" : "Security Features",
  "friority" : "Medium",
  "enginePriority" : "Medium",
  "reviewed" : null,
  "bugURL" : null,
  "externalBugId" : null,
  "primaryTag" : null,
  "hasAttachments" : false,
  "hasCorrelatedIssues" : false,
  "correlatedIssueIdsAsSource" : [],
  "correlatedIssueIdsAsTarget" : [],
  "hasComments" : false,
  "scanStatus" : "UPDATED",
  "foundDate" : "2025-11-10T07:43:21-05:00",
  "removedDate" : null,
  "engineType" : "SCA",
  "displayEngineType" : "SCA",
  "engineCategory" : "STATIC",
  "primaryRuleGuid" : "C72A3E77-8324-4FF9-B958-74FCDDF39D17",
  "impact" : 2.0,
  "likelihood" : 5.0,
  "severity" : 3.0,
  "confidence" : 5.0,
  "audited" : false,
  "issueStatus" : "Unreviewed",
  "primaryTagValueAutoApplied" : false,
  "hidden" : false,
  "suppressed" : false,
  "removed" : false,
  "_href" : "https://ssc.example.com/api/v1/projectVersions/20001/issues/156028",
  "location" : "about.html:17",
  "visibility" : "visible",
  "visibilityMarker" : " ",
  "folderName" : "Medium"
}
```

*Suppressed Issue*

```json
{
  "projectVersionId" : 20001,
  "lastScanId" : 40001,
  "id" : 2359,
  "projectVersionName" : null,
  "projectName" : null,
  "revision" : 1,
  "folderId" : 217,
  "folderGuid" : "5b50bb77-071d-08ed-fdba-1213fa90ac5a",
  "issueInstanceId" : "7062F805327F3B7989D24745B63A0248",
  "issueName" : "Mass Assignment: Insecure Binder Configuration",
  "primaryLocation" : "ApiRoleController.java",
  "lineNumber" : 114,
  "fullFileName" : "src/main/java/com/microfocus/example/api/controllers/ApiRoleController.java",
  "analyzer" : "Structural",
  "kingdom" : "API Abuse",
  "friority" : "High",
  "enginePriority" : "High",
  "reviewed" : null,
  "bugURL" : null,
  "externalBugId" : null,
  "primaryTag" : "Not an Issue",
  "hasAttachments" : false,
  "hasCorrelatedIssues" : false,
  "correlatedIssueIdsAsSource" : [],
  "correlatedIssueIdsAsTarget" : [],
  "hasComments" : true,
  "scanStatus" : "UPDATED",
  "foundDate" : "2022-11-11T17:48:24-05:00",
  "removedDate" : null,
  "engineType" : "SCA",
  "displayEngineType" : "SCA",
  "engineCategory" : "STATIC",
  "primaryRuleGuid" : "200D9F56-7BE2-41A1-9242-A6D7B5DE9439",
  "impact" : 3.0,
  "likelihood" : 1.8,
  "severity" : 5.0,
  "confidence" : 5.0,
  "audited" : true,
  "issueStatus" : "Reviewed",
  "primaryTagValueAutoApplied" : false,
  "hidden" : false,
  "suppressed" : true,
  "removed" : false,
  "_href" : "https://ssc.example.com/api/v1/projectVersions/20001/issues/2359",
  "location" : "ApiRoleController.java:114",
  "visibility" : "suppressed",
  "visibilityMarker" : "(S)",
  "folderName" : "High"
}
```

---

**Issue Count Data**

Sample output from `fcli ssc issue count --av=<appVersionNameOrId>`

```json
[
  {
    "id" : "Critical",
    "cleanName" : "Critical",
    "name" : "Critical - [39 / 39]",
    "totalCount" : 39,
    "auditedCount" : 39,
    "visibleCount" : 39
  },
  {
    "id" : "High",
    "cleanName" : "High",
    "name" : "High - [59 / 79]",
    "totalCount" : 79,
    "auditedCount" : 59,
    "visibleCount" : 79
  },
  {
    "id" : "Medium",
    "cleanName" : "Medium",
    "name" : "Medium - [5 / 83]",
    "totalCount" : 83,
    "auditedCount" : 5,
    "visibleCount" : 83
  },
  {
    "id" : "Low",
    "cleanName" : "Low",
    "name" : "Low - [215 / 224]",
    "totalCount" : 224,
    "auditedCount" : 215,
    "visibleCount" : 224
  }
]
```

---

**Filter Set Data**

Sample output from `fcli ssc issue list-filtersets --av=<appVersionNameOrId>`

```json
[
  {
    "guid" : "a243b195-0a59-3f8b-1403-d55b7a7d78e6",
    "title" : "Security Auditor View",
    "description" : "This setting provides the source code analyzer with the most comprehensive set of rules. It should be used to discover a broad set of security issues to be audited. Fortify SCA assigns issues impact, accuracy, probability, and confidence values, which are used to calculate issue priority. This set of filters uses these attributes to sort the issues into four folders: Critical, High, Medium and Low.",
    "defaultFilterSet" : true,
    "folders" : [
      {
        "id" : 216,
        "guid" : "b968f72f-cc12-03b5-976e-ad4c13920c21",
        "name" : "Critical",
        "color" : "ed1c24"
      },
      {
        "id" : 217,
        "guid" : "5b50bb77-071d-08ed-fdba-1213fa90ac5a",
        "name" : "High",
        "color" : "ff7800"
      },
      {
        "id" : 218,
        "guid" : "d5f55910-5f0d-a775-e91f-191d1f5608a4",
        "name" : "Medium",
        "color" : "f6aa58"
      },
      {
        "id" : 219,
        "guid" : "bb824e8d-b401-40be-13bd-5d156696a685",
        "name" : "Low",
        "color" : "eec845"
      }
    ]
  },
  {
    "guid" : "32142c2d-3f7f-4863-a1bf-9b1e2f34d2ed",
    "title" : "Quick View",
    "description" : "The Quick View filter set shows the most important issues that you should focus on first. It hides all medium- and low-priority findings, which have a lower impact on source code security, and hides findings that, while they might have a high potential impact, are least likely to be exploited.",
    "defaultFilterSet" : false,
    "folders" : [
      {
        "id" : 216,
        "guid" : "b968f72f-cc12-03b5-976e-ad4c13920c21",
        "name" : "Critical",
        "color" : "ed1c24"
      },
      {
        "id" : 217,
        "guid" : "5b50bb77-071d-08ed-fdba-1213fa90ac5a",
        "name" : "High",
        "color" : "ff7800"
      }
    ]
  },
  {
    "guid" : "5028979a-ddac-426a-84d3-7feb1661244e",
    "title" : "Audit Assistant",
    "description" : "Audit Assistant Filter",
    "defaultFilterSet" : false,
    "folders" : [
      {
        "id" : 225,
        "guid" : "7aff5e23-e6ea-4b01-8ae9-3ab8a51798c0",
        "name" : "Not an Issue",
        "color" : "00aa00"
      },
      {
        "id" : 226,
        "guid" : "4142b5c3-7680-43c2-9fa9-3085b53b255b",
        "name" : "Exploitable",
        "color" : "0000aa"
      },
      {
        "id" : 227,
        "guid" : "ec219b4a-0a5f-4d12-9ee3-1b21be8f7652",
        "name" : "Indeterminate",
        "color" : "aa0000"
      },
      {
        "id" : 228,
        "guid" : "33b7d47c-5b0d-4b9f-a837-9484e079b9e1",
        "name" : "Not predicted",
        "color" : "ffc800"
      }
    ]
  }
]
```

---

**Attribute Data**

Sample output from `fcli ssc attr list --av=<appVersionNameOrId>`

Only attributes with values set are shown. Attributes without values are returned with an empty `valueString`.

```json
[
  {
    "id" : 30,
    "guid" : "DevPhase",
    "name" : "Development Phase",
    "category" : "TECHNICAL",
    "_href" : "https://ssc.example.com/api/v1/projectVersions/20001/attributes/30",
    "attributeDefinitionId" : 5,
    "value" : null,
    "values" : [
      {
        "id" : null,
        "guid" : "Active",
        "name" : "Active Development",
        "description" : "This application has one or more production releases and is undergoing active development with plans for future functionality, application enhancements, and bug fixes.",
        "hidden" : false,
        "inUse" : true,
        "index" : 1,
        "projectMetaDataDefId" : 5,
        "publishVersion" : null,
        "objectVersion" : 1
      }
    ],
    "valueString" : "Active Development"
  },
  {
    "id" : 32,
    "guid" : "Accessibility",
    "name" : "Accessibility",
    "category" : "TECHNICAL",
    "_href" : "https://ssc.example.com/api/v1/projectVersions/20001/attributes/32",
    "attributeDefinitionId" : 7,
    "value" : null,
    "values" : [
      {
        "id" : null,
        "guid" : "externalpublicnetwork",
        "name" : "External Public Network Access Required",
        "description" : "Interaction can occur from an untrusted public network (e.g. the public internet).",
        "hidden" : false,
        "inUse" : true,
        "index" : 1,
        "projectMetaDataDefId" : 7,
        "publishVersion" : null,
        "objectVersion" : 1
      }
    ],
    "valueString" : "External Public Network Access Required"
  },
  {
    "id" : 35,
    "guid" : "Interfaces",
    "name" : "Interfaces",
    "category" : "TECHNICAL",
    "_href" : "https://ssc.example.com/api/v1/projectVersions/20001/attributes/35",
    "attributeDefinitionId" : 10,
    "value" : null,
    "values" : [
      {
        "id" : null,
        "guid" : "API",
        "name" : "Programmatic API",
        "description" : "Logic is only available through programmatic API access.",
        "hidden" : false,
        "inUse" : true,
        "index" : 0,
        "projectMetaDataDefId" : 10,
        "publishVersion" : null,
        "objectVersion" : 1
      },
      {
        "id" : null,
        "guid" : "WA",
        "name" : "Web Access",
        "description" : "Web browser based access",
        "hidden" : false,
        "inUse" : true,
        "index" : 1,
        "projectMetaDataDefId" : 10,
        "publishVersion" : null,
        "objectVersion" : 1
      }
    ],
    "valueString" : "Programmatic API, Web Access"
  },
  {
    "id" : 36,
    "guid" : "Languages",
    "name" : "Development Languages",
    "category" : "TECHNICAL",
    "_href" : "https://ssc.example.com/api/v1/projectVersions/20001/attributes/36",
    "attributeDefinitionId" : 11,
    "value" : null,
    "values" : [
      {
        "id" : null,
        "guid" : "java",
        "name" : "Java",
        "description" : "",
        "hidden" : false,
        "inUse" : true,
        "index" : 8,
        "projectMetaDataDefId" : 11,
        "publishVersion" : null,
        "objectVersion" : 1
      },
      {
        "id" : null,
        "guid" : "javascript",
        "name" : "JavaScript/AJAX",
        "description" : "",
        "hidden" : false,
        "inUse" : true,
        "index" : 9,
        "projectMetaDataDefId" : 11,
        "publishVersion" : null,
        "objectVersion" : 1
      }
    ],
    "valueString" : "Java, JavaScript/AJAX"
  }
]
```

---

**Performance Indicator Data**

Sample output from `fcli ssc pi list --av=<appVersionNameOrId>`

```json
[
  {
    "id" : "PercentCriticalPriorityIssuesAudited",
    "name" : "Critical Priority Issues Audited",
    "description" : "Percentage of issues that have a 'Critical' Fortify Priority Order and are audited",
    "value" : 100.0,
    "timestamp" : "2025-09-24T20:00:00.917-04:00",
    "range" : "percent",
    "_href" : "https://ssc.example.com/api/v1/projectVersions/20001/performanceIndicatorHistories/PercentCriticalPriorityIssuesAudited",
    "valueString" : "100.0%"
  },
  {
    "id" : "PercentCriticalPriorityIssues",
    "name" : "Critical Priority Issues",
    "description" : "Percentage of issues that have a 'Critical' Fortify Priority Order",
    "value" : 9.18,
    "timestamp" : "2025-09-24T20:00:00.917-04:00",
    "range" : "percent",
    "_href" : "https://ssc.example.com/api/v1/projectVersions/20001/performanceIndicatorHistories/PercentCriticalPriorityIssues",
    "valueString" : "9.18%"
  },
  {
    "id" : "PercentHighPriorityIssuesAudited",
    "name" : "High Priority Issues Audited",
    "description" : "Percentage of issues that have a 'High' Fortify Priority Order and are audited",
    "value" : 74.68,
    "timestamp" : "2025-09-24T20:00:00.917-04:00",
    "range" : "percent",
    "_href" : "https://ssc.example.com/api/v1/projectVersions/20001/performanceIndicatorHistories/PercentHighPriorityIssuesAudited",
    "valueString" : "74.68%"
  }
]
```

---

**Variable Data**

Sample output from `fcli ssc var list --av=<appVersionNameOrId>`

Variables are tenant-defined metrics derived from issue counts. Common built-in variables track issue counts by folder.

```json
[
  {
    "id" : "P0",
    "name" : "P0",
    "value" : 19,
    "timestamp" : "2025-09-24T20:00:00.917-04:00",
    "_href" : "https://ssc.example.com/api/v1/projectVersions/20001/variableHistories/P0"
  },
  {
    "id" : "P1",
    "name" : "P1",
    "value" : 76,
    "timestamp" : "2025-09-24T20:00:00.917-04:00",
    "_href" : "https://ssc.example.com/api/v1/projectVersions/20001/variableHistories/P1"
  },
  {
    "id" : "P2",
    "name" : "P2",
    "value" : 1,
    "timestamp" : "2025-09-24T20:00:00.917-04:00",
    "_href" : "https://ssc.example.com/api/v1/projectVersions/20001/variableHistories/P2"
  }
]
```

---

**User / Access Control Data**

Sample output from `fcli ssc access-control list-users`

```json
[
  {
    "id" : 50001,
    "isLdap" : false,
    "entityName" : "demo_user",
    "displayName" : "Demo User",
    "firstName" : "Demo",
    "lastName" : "User",
    "type" : "User",
    "ldapDn" : null,
    "userPhoto" : null,
    "email" : "demo_user@example.com",
    "_embed" : {
      "roles" : [
        {
          "name" : "Security Lead",
          "allApplicationRole" : false
        }
      ]
    },
    "_href" : "https://ssc.example.com/api/v1/authEntities/50001"
  },
  {
    "id" : 50002,
    "isLdap" : false,
    "entityName" : "admin_user",
    "displayName" : "Admin User",
    "firstName" : "Admin",
    "lastName" : "User",
    "type" : "User",
    "ldapDn" : null,
    "userPhoto" : null,
    "email" : "admin_user@example.com",
    "_embed" : {
      "roles" : [
        {
          "name" : "Administrator",
          "allApplicationRole" : true
        }
      ]
    },
    "_href" : "https://ssc.example.com/api/v1/authEntities/50002"
  }
]
```
