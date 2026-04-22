## Use Case: Portfolio Overview — Understanding the Asset Landscape

The user wants a broad view across multiple applications or releases (e.g., "show me all my apps", "which releases are in production", "how many critical issues does each app have").

**List all applications:**
```bash
fcli fod app list -o json
fcli fod app list --query "businessCriticalityType=='High'" -o json
```

**List releases with security metrics** (includes severity counts and scan status per release):
```bash
fcli fod release list -o json
fcli fod release list --query "sdlcStatusType=='Production'" -o json
fcli fod release list --query "applicationName matches '(?i).*payment.*'" -o json
```

Release data includes precomputed issue counts (`critical`, `high`, `staticCritical`, `openSourceHigh`, `isPassed`, etc.) — use these for portfolio-level summaries without querying issues at all. See `references/fcli-fod-output-values.md` for the full field list.

**Summarize** the results from the JSON: count apps, group by business criticality, highlight failing policy, etc. Do not display raw JSON to the user.

> **Portfolio analytics across more than 2–3 apps via issue-level queries is not recommended.** Use release-level aggregate fields for large portfolios; issue-level queries do not scale across many apps. If the user wants to drill into issues for a specific app or release, switch to the Application Context or Issue Investigation use cases.

> **For open source component risk across the portfolio** — use the OSS Component Analysis use case (`references/use-case-oss-component-analysis.md`). Release-level fields (`openSourceCritical`, `openSourceHigh`, etc.) give aggregate OSS counts; the OSS use case covers component-level detail, CVE impact triage, and license risk.
