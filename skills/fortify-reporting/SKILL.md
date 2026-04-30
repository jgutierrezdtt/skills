---
name: fortify-reporting
version: 1.0
tested-with:
  fcli: "3.18"
  fod: "26.1"
  ssc: "25.4"
always-in-context:
  - SKILL.md
on-demand:
  - references/executive-summary.md
  - references/compliance-mapping.md
  - references/trend-analysis.md
  - references/custom-action-reports.md
---

# Fortify Reporting Skill

This skill covers generating and structuring security reports from Fortify data: executive summaries, compliance posture assessments, trend analysis across scan cycles, and automating report generation via fcli custom actions.

Load this skill when the user is asking about:
- Generating an executive or management-level security summary
- Mapping findings to compliance controls (PCI DSS, SOC 2, HIPAA, OWASP)
- Analyzing how security posture has changed over time
- Automating periodic reports via fcli custom actions
- Exporting data for dashboards or external tools

For portfolio-level queries with no reporting formatting requirement, use the `fortify-fod` or `fortify-ssc` portfolio use cases instead.

---

## Platform Disambiguation

| Platform | Application identifier | Issue identifier |
|----------|----------------------|-----------------|
| FoD | `--rel <app>:<release>` | `instanceId` |
| SSC | `--av <app>:<version>` | `issueInstanceId` |

If the user has not specified a platform, ask once: "FoD or SSC?"

---

## Output Format Guidance

- Use `-o json` when exporting data for downstream processing or automation.
- Use `-o csv` when the user wants a file for spreadsheet tools or external dashboards.
- Use `-o table` for human-readable terminal summaries.
- For custom action report output, default to JSON and let the action template handle formatting.

---

## Reference Files

| File | Load when... |
|------|-------------|
| `references/executive-summary.md` | The user wants a high-level summary for management or leadership |
| `references/compliance-mapping.md` | The user wants to map findings to PCI DSS, SOC 2, HIPAA, or OWASP controls |
| `references/trend-analysis.md` | The user wants to compare posture across scan cycles or over time |
| `references/custom-action-reports.md` | The user wants to automate report generation via fcli custom actions |

## Use Case Index

| Request | File to load |
|---------|-------------|
| Executive summary of application security posture | `references/executive-summary.md` |
| Management-level risk dashboard | `references/executive-summary.md` |
| Map issues to PCI DSS, SOC 2, or HIPAA controls | `references/compliance-mapping.md` |
| OWASP Top 10 or CWE breakdown | `references/compliance-mapping.md` |
| Trend over time or regression detection | `references/trend-analysis.md` |
| Compare current scan to previous scan | `references/trend-analysis.md` |
| Automate a recurring report | `references/custom-action-reports.md` |
| Generate a report from a fcli custom action | `references/custom-action-reports.md` |
