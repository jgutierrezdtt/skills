# OpenText Fortify Skills

AI agent skills that teach Claude, GitHub Copilot and other AI agents how to use [OpenText Fortify](https://www.opentext.com/products/application-security) effectively — covering SAST/DAST/SCA scanning, vulnerability triage, audit workflows, CI/CD integration, FCLI commands and more.

## Skills

| Skill | Description |
|-------|-------------|
| **fortify-fod** | Fortify on Demand (SaaS) — applications, releases, scans, issues, OSS analysis, portfolio reporting |
| **fortify-ssc** | Software Security Center (on-premise) — manage application versions, artifacts, scan jobs, issue triage |
| **fortify-remediate** | Fix vulnerabilities detected by Fortify — SAST, DAST, and SCA findings; Aviator AI remediation |
| **fortify-security-assistant** | Detect common, high impact security issues in code as it is being generated |
| **fortify-create-app** | Create new Fortify applications in FoD or SSC — guided onboarding with validation and defaults |
| **fortify-cicd-integration** | Add Fortify scanning to CI/CD pipelines — GitHub Actions, GitLab CI, Azure DevOps, Jenkins |
| **fcli-common** | Fortify CLI (fcli) — installation, authentication, output formats, SpEL queries, custom actions |
| **fortify-governance** | Platform administration — user and role management, token lifecycle, application onboarding, SSC administration |
| **fortify-audit-workflow** | Issue triage lifecycle — bulk audit operations, false positive management, risk acceptance with documentation |
| **fortify-reporting** | Security reporting — executive summaries, compliance mapping (PCI DSS, SOC 2, HIPAA, OWASP), trend analysis, custom action reports |
| **fortify-custom-rules** | Extend Fortify — custom SAST rulepack authoring (all analyzer types), rulepack management in SSC, fcli action signing, compliance mapping |


## Agents

Agents are multi-skill orchestrators that handle end-to-end workflows.

| Agent | Description |
|-------|-------------|
| **fortify-onboarding** | Onboard new applications into Fortify (FoD or SSC) — creates the app, configures settings, and optionally sets up CI/CD scanning pipelines. Handles single repos, bulk lists, or entire GitHub/GitLab/Azure DevOps organizations |

## Prerequisites

- **fcli** installed and on your PATH — [install instructions](skills/fcli-common/references/fcli-install.md)
- An active Fortify on Demand (FoD) or Software Security Center (SSC) account
- An AI assistant that supports Agent Skills (Claude Code, GitHub Copilot, Cursor, Gemini CLI, etc.)

## Installation

### Claude Code

Add the marketplace from GitHub, then install the plugin:

```bash
claude plugin marketplace add fortify/skills
claude plugin install fortify-skills@fortify
```

The plugin registers all eleven skills and the onboarding agent automatically.

### GitHub Copilot

**Recommended: install the [Fortify Code Security](https://marketplace.visualstudio.com/items?itemName=fortifyvsts.fortify-code-security) VS Code extension.** It bundles all Fortify skills, can automatically install fcli, and adds full IDE integration (scanning, vulnerability review, Aviator AI remediation, and an optional fcli MCP server):

1. Open VS Code and search for **Fortify Code Security** in the Extensions panel, or install directly:
   ```
   ext install fortifyvsts.fortify-code-security
   ```
2. The extension registers all skills automatically and sets up GitHub Copilot Agent Mode integration.

**Alternative: manual install.** Copy the skills to your Copilot skills directory:

```
<user>/.copilot/skills/
```

This gives you the skills without the IDE features (scanning UI, vulnerability browser, Aviator inline fixes, MCP server).

### OpenAI Codex

This repository includes a marketplace catalog at `.agents/plugins/marketplace.json`. When the repo is your current workspace, Codex discovers it automatically as a repo-scoped marketplace. Open the plugin directory, select **OpenText Fortify**, and install **fortify-skills**.

To make the plugin available across all workspaces, add an entry to your personal marketplace at `~/.agents/plugins/marketplace.json` (create the file if it doesn't exist), replacing `<path>` with the absolute path to this directory:

```json
{
  "name": "fortify",
  "interface": { "displayName": "OpenText Fortify" },
  "plugins": [
    {
      "name": "fortify-skills",
      "source": { "source": "local", "path": "<path>" },
      "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" },
      "category": "Security"
    }
  ]
}
```

Then restart Codex. The plugin registers all eleven skills automatically.

### Gemini CLI

Install directly from the GitHub repository:

```bash
gemini extensions install https://github.com/fortify/skills
```

The extension bundles all eleven skills. Gemini CLI auto-discovers them and activates whichever skill is relevant to your task.

To test locally before publishing:

```bash
gemini extensions link /path/to/public
```

### Other AI assistants

Any assistant that supports the [Agent Skills](https://agentskills.io) standard can load skills from this directory. Point your assistant's skill path to the `skills/` subdirectory.

## Usage

Once installed, the skills activate automatically when relevant. Examples of prompts that trigger each skill:

| Prompt | Skill / Agent activated |
|--------|------------------------|
| "Onboard this repo to Fortify" | fortify-onboarding (agent) |
| "Create a new application in FoD for our payments team" | fortify-create-app |
| "Show me all critical issues in the payment-service release" | fortify-fod |
| "Upload my FPR and check policy compliance" | fortify-ssc |
| "Fix the SQL Injection findings in UserService.java" | fortify-remediate |
| "Add a new endpoint that returns account details" | fortify-security-assistant |
| "Add Fortify scanning to my GitHub Actions workflows" | fortify-cicd-integration |
| "Create a custom fcli action to export FoD critical issues as CSV" | fortify-fod + fcli-common |
| "Show me all users in SSC and who has admin access" | fortify-governance |
| "Mark these 30 findings as false positive with justification" | fortify-audit-workflow |
| "Generate a compliance report for PCI DSS v4.0" | fortify-reporting |
| "Create a custom SAST rule to detect our internal API misuse" | fortify-custom-rules |


## Resources

- [Fortify CLI (fcli) — GitHub](https://github.com/fortify/fcli)
- [Fortify on Demand documentation](https://www.microfocus.com/documentation/fortify-on-demand/)
- [Software Security Center documentation](https://www.microfocus.com/documentation/fortify-software-security-center/)

## License

MIT

---

## Additional skills in this fork

This fork extends the upstream `fortify/skills` with four additional skills covering platform governance, issue triage, security reporting, and custom SAST rule authoring. These are not yet part of the upstream repository.

**`fortify-governance`** — The core platform skills (`fortify-fod`, `fortify-ssc`) cover business operations: scans, issues, releases. They assume the platform is already configured. Governance fills the gap with user and role management (including offboarding), token and API key lifecycle, structured application onboarding (one-repo-one-app pattern, version seeding, attribute templates), and SSC-specific administration: rulepacks, plugins, LDAP, and custom tags at instance level.

**`fortify-audit-workflow`** — `fortify-fod` and `fortify-ssc` can list and query issues but do not guide audit decisions. This skill adds an explicit audit state model with compliance implications per state, operational guardrails (50-issue bulk limit, mandatory comments, list-before-write), a precise distinction between `False Positive`, `Suppressed`, and `Risk Accepted` — three concepts frequently confused — and a formal risk acceptance workflow with escalation criteria and approver requirements for high-severity findings.

**`fortify-reporting`** — The portfolio use cases in `fortify-fod` and `fortify-ssc` return raw query data. This skill transforms that data into structured output: executive summaries with RAG status and immediate actions, compliance gap analysis mapped to PCI DSS v4.0, SOC 2, HIPAA, and OWASP Top 10 controls with per-control issue counts, trend analysis with remediation velocity across scan cycles, and automation of recurring reports via fcli custom actions with CI/CD pipeline integration patterns.

**`fortify-custom-rules`** — Covers the full SAST rule authoring surface: taint flag catalog, CharacterizationRule with structural predicates, SuppressionRule/AliasRule for FP elimination, compliance mapping via external-metadata.xml (CWE/OWASP/PCI-DSS), ContentRule/ConfigurationRule for XML/JSON/YAML/properties misconfigurations, ControlFlowRule state machines for resource leak and call-sequence detection, and quick-reference tables of className/functionName for 8 frameworks (Spring, JEE, ASP.NET Core, Django, Flask, Express, Go, Rails).
