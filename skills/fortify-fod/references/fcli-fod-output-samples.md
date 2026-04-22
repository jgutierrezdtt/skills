Sample output from various FoD get and list commands.  All of these assume the use of json output with `-o json`.  Other output options may not produce the full set of data.

**Application Data**

Sample output from `fcli fod app get` and `fcli fod app list`

```

{
  "applicationId" : 100001,
  "applicationName" : "MyOrg/SampleWebApp",
  "applicationDescription" : null,
  "applicationCreatedDate" : "2022-09-01T19:31:40.763",
  "businessCriticalityTypeId" : 1,
  "businessCriticalityType" : "High",
  "emailList" : "",
  "applicationTypeId" : 1,
  "applicationType" : "Web_Thick_Client",
  "hasMicroservices" : false,
  "attributes" : [ {
    "name" : "Region",
    "id" : 1001,
    "value" : "Americas"
  }, {
    "name" : "Business Unit",
    "id" : 1002,
    "value" : "Logistics"
  }, {
    "name" : "Security Champion",
    "id" : 1003,
    "value" : "10002"
  }, {
    "name" : "Code Respository",
    "id" : 1004,
    "value" : "https://github.com/MyOrg/SampleWebApp.git"
  } ],
  "fcliApplicationType" : "Web/Thick Client"
}

```

**Release Data**

Sample output from `fcli fod release get` and `fcli fod release list`

```

{
  "releaseId" : 200001,
  "releaseName" : "main",
  "releaseDescription" : "Fully integrated with GitHub",
  "suspended" : false,
  "releaseCreatedDate" : "2022-09-26T14:21:06.513",
  "microserviceName" : "",
  "microserviceId" : null,
  "applicationId" : 100001,
  "applicationName" : "MyOrg/SampleWebApp",
  "currentAnalysisStatusTypeId" : 2,
  "currentAnalysisStatusType" : "Completed",
  "rating" : 1,
  "critical" : 111,
  "high" : 167,
  "medium" : 140,
  "low" : 24,
  "staticCritical" : 40,
  "staticHigh" : 9,
  "staticMedium" : 0,
  "staticLow" : 1,
  "dynamicCritical" : 0,
  "dynamicHigh" : 1,
  "dynamicMedium" : 2,
  "dynamicLow" : 9,
  "mobileCritical" : 0,
  "mobileHigh" : 0,
  "mobileMedium" : 0,
  "mobileLow" : 0,
  "openSourceCritical" : 71,
  "openSourceHigh" : 157,
  "openSourceMedium" : 138,
  "openSourceLow" : 14,
  "currentStaticScanId" : 300001,
  "currentDynamicScanId" : 300003,
  "currentMobileScanId" : null,
  "staticAnalysisStatusType" : "Completed",
  "dynamicAnalysisStatusType" : "Completed",
  "mobileAnalysisStatusType" : null,
  "staticAnalysisStatusTypeId" : 2,
  "dynamicAnalysisStatusTypeId" : 2,
  "mobileAnalysisStatusTypeId" : null,
  "staticScanDate" : "2026-04-03T19:22:20.4",
  "dynamicScanDate" : "2022-12-14T23:28:51.07",
  "mobileScanDate" : null,
  "issueCount" : 456,
  "isPassed" : false,
  "passFailReasonTypeId" : null,
  "passFailReasonType" : null,
  "sdlcStatusTypeId" : 1,
  "sdlcStatusType" : "Production",
  "ownerId" : 10001,
  "IsDebrickedScanEnabled" : false,
  "attributes" : [ {
    "name" : "Branch",
    "id" : 1005,
    "value" : "False"
  } ]
}

```

**Scan Data**

Sample output from `fcli fod sast-scan get` and `fcli fod sast-scan get`

```

{
  "startedByUserId" : 10001,
  "startedByUserName" : "demo_user",
  "dynamicScanSummaryDetails" : null,
  "mobileScanSummaryDetails" : null,
  "staticScanSummaryDetails" : {
    "technologyStack" : "JAVA/J2EE/Kotlin",
    "languageLevel" : "1.8",
    "doSonatypeScan" : true,
    "auditPreferenceType" : "Automated",
    "excludeThirdPartyLibs" : true,
    "buildDate" : "2026-04-03T00:00:00",
    "engineVersion" : "25.4.0.0135",
    "rulePackVersion" : "2025.4.0.0009, FOD.CR.1.0",
    "fileCount" : 236,
    "totalLinesOfCode" : 33367,
    "payLoadSize" : "85,404.76 KB",
    "staticVulnerabilityFilter" : null,
    "includeFortifyAviator" : true,
    "fortifyAviatorError" : null
  },
  "applicationId" : 100001,
  "applicationName" : "MyOrg/SampleWebApp",
  "releaseId" : 200001,
  "releaseName" : "main",
  "scanId" : 300001,
  "scanTypeId" : 1,
  "scanType" : "Static",
  "assessmentTypeId" : 274,
  "assessmentTypeName" : "Static Assessment",
  "analysisStatusTypeId" : 2,
  "analysisStatusType" : "Completed",
  "startedDateTime" : "2026-04-03T19:19:34",
  "completedDateTime" : "2026-04-03T19:22:20",
  "totalIssues" : 60,
  "issueCountCritical" : 43,
  "issueCountHigh" : 16,
  "issueCountMedium" : 0,
  "issueCountLow" : 1,
  "starRating" : 4,
  "notes" : "",
  "isFalsePositiveChallenge" : false,
  "isRemediationScan" : false,
  "entitlementId" : 50001,
  "entitlementUnitsConsumed" : 0,
  "isSubscriptionEntitlement" : true,
  "pauseDetails" : [ ],
  "cancelReason" : null,
  "analysisStatusReasonNotes" : null,
  "scanMethodTypeId" : 4,
  "scanMethodTypeName" : "Other",
  "scanTool" : "fcli",
  "scanToolVersion" : "3.16.0",
  "attributes" : null
}

```

Sample output from `fcli fod oss-scan get` and `fcli fod oss-scan get`

```

{
  "startedByUserId" : 10001,
  "startedByUserName" : "demo_user",
  "dynamicScanSummaryDetails" : null,
  "mobileScanSummaryDetails" : null,
  "staticScanSummaryDetails" : null,
  "applicationId" : 100001,
  "applicationName" : "MyOrg/SampleWebApp",
  "releaseId" : 200001,
  "releaseName" : "main",
  "scanId" : 300002,
  "scanTypeId" : 7,
  "scanType" : "OpenSource",
  "assessmentTypeId" : 303,
  "assessmentTypeName" : "Debricked",
  "analysisStatusTypeId" : 2,
  "analysisStatusType" : "Completed",
  "startedDateTime" : "2026-04-03T19:22:03",
  "completedDateTime" : "2026-04-03T19:23:40",
  "totalIssues" : 392,
  "issueCountCritical" : 71,
  "issueCountHigh" : 157,
  "issueCountMedium" : 138,
  "issueCountLow" : 14,
  "starRating" : 4,
  "notes" : null,
  "isFalsePositiveChallenge" : false,
  "isRemediationScan" : false,
  "entitlementId" : 50002,
  "entitlementUnitsConsumed" : 0,
  "isSubscriptionEntitlement" : true,
  "pauseDetails" : [ ],
  "cancelReason" : null,
  "analysisStatusReasonNotes" : null,
  "scanMethodTypeId" : null,
  "scanMethodTypeName" : null,
  "scanTool" : "Debricked",
  "scanToolVersion" : null,
  "attributes" : null
}

```

Sample output from `fcli fod dast-scan get` and `fcli fod dast-scan get`

```

{
  "startedByUserId" : 10001,
  "startedByUserName" : "demo_user",
  "dynamicScanSummaryDetails" : {
    "dynamicSiteURL" : null,
    "restrictToDirectoryAndSubdirectories" : false,
    "allowSameHostRedirects" : true,
    "allowFormSubmissions" : true,
    "timeZone" : "Eastern Standard Time",
    "dynamicScanEnvironmentFacingType" : "External",
    "hasAvailabilityRestrictions" : false,
    "requestCall" : false,
    "hasFormsAuthentication" : false,
    "requiresNetworkAuthentication" : false,
    "isWebService" : true,
    "webServiceType" : "PostmanCollectionURL",
    "userAgentType" : "Desktop",
    "notes" : null,
    "concurrentRequestThreadsType" : "Standard",
    "elapsedTimeSpan" : "00:04:45",
    "policyName" : "API",
    "crawlSessions" : 0,
    "failedRequests" : 0,
    "logouts" : 0,
    "macroPlaybacks" : 1,
    "scanType" : null,
    "timeBoxInHours" : null
  },
  "mobileScanSummaryDetails" : null,
  "staticScanSummaryDetails" : null,
  "applicationId" : 100001,
  "applicationName" : "SampleWebApp",
  "releaseId" : 200001,
  "releaseName" : "main",
  "scanId" : 300003,
  "scanTypeId" : 2,
  "scanType" : "Dynamic",
  "assessmentTypeId" : 299,
  "assessmentTypeName" : "Dynamic API Assessment",
  "analysisStatusTypeId" : 2,
  "analysisStatusType" : "Completed",
  "startedDateTime" : "2022-12-14T21:32:35",
  "completedDateTime" : "2022-12-14T23:28:51",
  "totalIssues" : 14,
  "issueCountCritical" : 0,
  "issueCountHigh" : 1,
  "issueCountMedium" : 2,
  "issueCountLow" : 9,
  "starRating" : 2,
  "notes" : null,
  "isFalsePositiveChallenge" : false,
  "isRemediationScan" : false,
  "entitlementId" : 50003,
  "entitlementUnitsConsumed" : 6,
  "isSubscriptionEntitlement" : true,
  "pauseDetails" : [ ],
  "cancelReason" : null,
  "analysisStatusReasonNotes" : null,
  "scanMethodTypeId" : 3,
  "scanMethodTypeName" : "Browser",
  "scanTool" : "WebUI",
  "scanToolVersion" : "22.4.0.17",
  "attributes" : null
}

```

Sample output from `fcli fod mast-scan get` and `fcli fod mast-scan list`

```

{
  "startedByUserId" : 10001,
  "startedByUserName" : "demo_user",
  "dynamicScanSummaryDetails" : null,
  "mobileScanSummaryDetails" : {
    "frameworkType" : "iOS",
    "auditPreferenceType" : "Automated",
    "platformType" : "Both",
    "identifier" : "com.swaroop.iGoat",
    "version" : "3.0 (1)",
    "userAccountsRequried" : true,
    "accessToWebServices" : true,
    "hasExclusions" : false,
    "hasAvailabilityRestrictions" : false
  },
  "staticScanSummaryDetails" : null,
  "applicationId" : 100002,
  "applicationName" : "SampleMobileApp (iOS/Swift)",
  "releaseId" : 200002,
  "releaseName" : "3.0",
  "scanId" : 300004,
  "scanTypeId" : 4,
  "scanType" : "Mobile",
  "assessmentTypeId" : 271,
  "assessmentTypeName" : "Mobile Assessment",
  "analysisStatusTypeId" : 2,
  "analysisStatusType" : "Completed",
  "startedDateTime" : "2023-08-18T13:00:13",
  "completedDateTime" : "2023-08-18T13:03:36",
  "totalIssues" : 74,
  "issueCountCritical" : 1,
  "issueCountHigh" : 0,
  "issueCountMedium" : 1,
  "issueCountLow" : 69,
  "starRating" : 1,
  "notes" : null,
  "isFalsePositiveChallenge" : false,
  "isRemediationScan" : false,
  "entitlementId" : 50003,
  "entitlementUnitsConsumed" : 4,
  "isSubscriptionEntitlement" : true,
  "pauseDetails" : [ ],
  "cancelReason" : null,
  "analysisStatusReasonNotes" : null,
  "scanMethodTypeId" : 3,
  "scanMethodTypeName" : "Browser",
  "scanTool" : "WebUI",
  "scanToolVersion" : "26.2.1.14",
  "attributes" : null
}

```

**Issue Data**

Sample output from `fcli fod issue list`

```

{
  "id" : 400001,
  "releaseId" : 200001,
  "fisma" : "SI",
  "nistsp800_53rev5" : "SI-10 - Information Input Validation, SC-5 - Denial of Service Protection",
  "severityString" : "Critical",
  "severity" : 4,
  "category" : "XML External Entity Injection",
  "kingdom" : "Input Validation and Representation",
  "owasp2017" : "A4 - XML External Entities (XXE)",
  "owasp2021" : "A05 - Security Misconfiguration",
  "owasp2023" : "(Not Set)",
  "owaspAsvs4_0" : null,
  "owaspAsvs5_0" : null,
  "cwe" : "CWE-611",
  "cwetop25_2023" : "(Not Set)",
  "cwetop25_2024" : "(Not Set)",
  "package" : "Java J2EE JAXP",
  "primaryLocation" : "UserController.java",
  "vulnId" : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "analysisType" : "(Not Set)",
  "lineNumber" : 572,
  "hasComments" : true,
  "assignedUser" : "(Not Set)",
  "scantype" : "Static",
  "subtype" : null,
  "primaryLocationFull" : "src/main/java/com/microfocus/example/web/controllers/UserController.java",
  "hasAttachments" : false,
  "pci1_2" : null,
  "pci2" : null,
  "wasc24_2" : null,
  "isSuppressed" : false,
  "suppressedBy" : null,
  "scanId" : 300001,
  "pci3" : null,
  "pci4" : null,
  "pci401" : "6.2.4 - Software Coding Vulnerabilities",
  "pcissf1" : null,
  "stig6" : null,
  "instanceId" : "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  "auditPendingAuditorStatus" : "(No Change)",
  "auditorStatus" : "Remediation Required",
  "checkId" : "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "closedDate" : null,
  "closedStatus" : false,
  "developerStatus" : "Open",
  "falsePositiveChallenge" : "0",
  "introducedDate" : "2022-09-02",
  "scanStartedDate" : "2026-04-03T00:00:00",
  "scanCompletedDate" : "2026-04-03T00:00:00",
  "status" : "Existing",
  "bugSubmitted" : false,
  "bugLink" : "",
  "auditPendingSuppression" : null,
  "source" : "handleXMLUpdate(1)",
  "sink" : "javax.xml.transform.Transformer.transform()",
  "timeToFixDays" : null,
  "fortifyAviator" : true,
  "lastModifiedDate" : "2026-04-03T19:22:19",
  "aviatorRemediationGuidanceAvailable" : false,
  "location" : "UserController.java:572",
  "visibility" : "visible",
  "visibilityMarker" : " "
}

```

**Open Source Component (OSS) Data**

Sample output from `fcli fod oss-scan list-components`

```

{
  "componentHash" : "Debricked:maven:org.yaml:snakeyaml@1.23",
  "componentName" : "org.yaml:snakeyaml",
  "componentVersionName" : "1.23",
  "licenses" : [ {
    "name" : "Apache-2.0"
  } ],
  "vulnerabilityCounts" : [ {
    "severityId" : 4,
    "severity" : "Critical",
    "count" : 1
  }, {
    "severityId" : 3,
    "severity" : "High",
    "count" : 2
  }, {
    "severityId" : 2,
    "severity" : "Medium",
    "count" : 5
  } ],
  "releases" : [ {
    "applicationId" : 100001,
    "applicationName" : "fMyOrg/SampleWebApp",
    "releaseId" : 100001,
    "releaseName" : "main"
  } ],
  "packageUrl" : "pkg:maven/org.yaml/snakeyaml@1.23",
  "scanTool" : "Debricked",
  "licenseSummary" : "Apache-2.0",
  "issueSummary" : "Critical:1, High:2, Medium:5",
  "isVulnerable" : true,
  "openSourceCritical" : 1,
  "openSourceHigh" : 2,
  "openSourceMedium" : 5,
  "openSourceLow" : 0,
  "issueCount" : 8
}

```
