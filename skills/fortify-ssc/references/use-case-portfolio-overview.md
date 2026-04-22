## Use Case: Portfolio Overview — Understanding the Asset Landscape

The user wants a broad view across multiple applications or versions (e.g., "show me all my apps", "which versions were scanned recently", "how many critical issues does each app have", "which versions have unprocessed artifacts").

**List all applications:**
```bash
fcli ssc app list -o json
fcli ssc app list --query "name matches '(?i).*payment.*'" -o json
```

**List all application versions** (includes version health data via `currentState`):
```bash
fcli ssc appversion list -o json
fcli ssc appversion list --query "application.name matches '(?i).*payment.*'" -o json
```

**Filter versions by activity or health indicators:**
```bash
# Versions with scan results loaded
fcli ssc appversion list --query "currentState.analysisResultsExist==true" -o json

# Versions that need attention (processing errors or admin action required)
fcli ssc appversion list --query "currentState.attentionRequired==true" -o json

# Versions with a recent FPR upload (in the last 7 days)
fcli ssc appversion list --query "#date(currentState.lastFprUploadDate) > #now('-7d')" -o json

# Versions with no scan results yet
fcli ssc appversion list --query "currentState.analysisResultsExist==false" -o json

# Versions where critical issue count increased recently
fcli ssc appversion list --query "currentState.criticalPriorityIssueCountDelta > 0" -o json

# Active versions only
fcli ssc appversion list --query "active==true" -o json
```

**Summarize** the JSON results: count apps or versions, group by attribute, highlight versions needing attention. Do not display raw JSON to the user.

> **Portfolio analytics via issue-level queries is not recommended across many applications.** Use version-level data and `issue count` per version for portfolio summaries. Issue-level queries do not scale across large portfolios. If the user wants to drill into issues for a specific version, switch to the Application Version Context or Issue Investigation use cases.

> **For issue counts across a set of versions**, use `fcli ssc issue count --av=<appVersionNameOrId>` per version — this returns aggregate counts by severity folder without loading individual issues.
