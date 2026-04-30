---
name: fortify-audit-workflow
version: 1.0
tested-with:
  fcli: "3.18"
  fod: "26.1"
  ssc: "25.4"
always-in-context:
  - SKILL.md
on-demand:
  - references/bulk-triage.md
  - references/false-positive-management.md
  - references/risk-acceptance.md
---

# Fortify Audit Workflow Skill

This skill covers the triage and audit lifecycle for security findings: classifying issues, suppressing false positives, bulk-updating status at scale, and formally accepting risk with documentation. It applies to both FoD and SSC.

Load this skill when the user is asking about:
- Triaging or reviewing security findings
- Suppressing or marking issues as false positives
- Bulk-updating issue status or custom tags across many findings
- Accepting risk for a set of findings with justification
- Tracking audit progress toward a compliance gate or policy pass

For scanning, reporting, or remediation, activate the appropriate platform skill (`fortify-fod`, `fortify-ssc`) or `fortify-remediate` instead.

---

## Platform Disambiguation

| Platform | Application identifier | Issue identifier |
|----------|----------------------|-----------------|
| FoD | `--rel <app>:<release>` | `instanceId` |
| SSC | `--av <app>:<version>` | `issueInstanceId` |

If the user has not specified a platform, ask once: "FoD or SSC?"

---

## Audit State Model

Both platforms support a set of audit states (also called review status or analysis):

| State | FoD value | SSC value | Meaning |
|-------|-----------|-----------|---------|
| Not reviewed | `Not Reviewed` | `Not Reviewed` | Default, no human decision |
| Confirmed | `Reliability Issue` / `Bug` | `Reliability Issue` / `Bug` | Confirmed real vulnerability |
| Suppressed | `Suppressed` | `Suppressed` | Intentionally hidden from counts |
| False positive | `False Positive` | `False Positive` | Developer-confirmed not a real issue |
| Risk accepted | `Risk Accepted` | `Risk Accepted` | Acknowledged, no fix planned |

An issue marked as `Suppressed` does not count toward policy compliance. An issue marked as `Risk Accepted` still counts unless the policy explicitly excludes it.

---

## Core Safety Rules

- Never bulk-suppress or bulk-accept more than 50 issues in a single command without showing the user the issue list first and receiving explicit confirmation.
- Always filter to a specific application version/release before running any audit write operation.
- Risk acceptance must be accompanied by a comment explaining the business justification. Prompt the user for this if not provided.
- Never delete issues — only change their audit state.

---

## Reference Files

| File | Load when... |
|------|-------------|
| `references/bulk-triage.md` | The user wants to update audit state or custom tags for multiple issues at once |
| `references/false-positive-management.md` | The user wants to mark, review, or track false positives |
| `references/risk-acceptance.md` | The user wants to formally accept risk for a finding or a set of findings |

## Use Case Index

| Request | File to load |
|---------|-------------|
| Bulk-mark issues as confirmed, suppressed, or risk accepted | `references/bulk-triage.md` |
| Apply or update custom tags across many findings | `references/bulk-triage.md` |
| Mark an issue as a false positive with evidence | `references/false-positive-management.md` |
| Review and list all current false positives | `references/false-positive-management.md` |
| Formally accept risk for a finding | `references/risk-acceptance.md` |
| Track which findings have pending risk acceptance decisions | `references/risk-acceptance.md` |
| Check audit coverage (what percentage of issues have been reviewed) | `references/bulk-triage.md` |
