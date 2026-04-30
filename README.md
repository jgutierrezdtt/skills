# OpenText Fortify Skills

AI agent skills that teach Claude, GitHub Copilot and other AI agents how to use [OpenText Fortify](https://www.opentext.com/products/application-security) effectively — covering SAST/DAST/SCA scanning, vulnerability triage, audit workflows, CI/CD integration, FCLI commands and more.

## Skills

| Skill | Description | References |
|-------|-------------|-----------|
| **fortify-fod** | Fortify on Demand (SaaS) — applications, releases, scans, issues, OSS analysis, portfolio reporting | 6 original |
| **fortify-ssc** | Software Security Center (on-premise) — manage application versions, artifacts, scan jobs, issue triage | 7 original |
| **fortify-remediate** | Fix vulnerabilities detected by Fortify — SAST, DAST, and SCA findings; Aviator AI remediation | 4 original |
| **fortify-cicd-integration** | Add Fortify scanning to CI/CD pipelines — GitHub Actions, GitLab CI, Azure DevOps, Jenkins | 2 original + **2 added** (azure-devops, jenkins) |
| **fcli-common** | Fortify CLI (fcli) — installation, authentication, output formats, SpEL queries, custom actions | 4 original |
| **fortify-governance** | Platform administration — user and role management, token lifecycle, application onboarding, SSC administration | **4 new** |
| **fortify-audit-workflow** | Issue triage lifecycle — bulk audit operations, false positive management, risk acceptance with documentation | **3 new** |
| **fortify-reporting** | Security reporting — executive summaries, compliance mapping (PCI DSS, SOC 2, HIPAA, OWASP), trend analysis, custom action reports | **4 new** |
| **fortify-custom-rules** | Extend Fortify — custom SAST rulepack authoring (all analyzer types), rulepack management in SSC, fcli action signing, compliance mapping | 3 original + **7 added** |

### What the new skills add

**`fortify-governance`** — The core platform skills (`fortify-fod`, `fortify-ssc`) cover business operations: scans, issues, releases. They assume the platform is already configured. Governance fills the gap with user and role management (including offboarding), token and API key lifecycle, structured application onboarding (one-repo-one-app pattern, version seeding, attribute templates), and SSC-specific administration: rulepacks, plugins, LDAP, and custom tags at instance level.

**`fortify-audit-workflow`** — `fortify-fod` and `fortify-ssc` can list and query issues but do not guide audit decisions. This skill adds an explicit audit state model with compliance implications per state, operational guardrails (50-issue bulk limit, mandatory comments, list-before-write), a precise distinction between `False Positive`, `Suppressed`, and `Risk Accepted` — three concepts frequently confused — and a formal risk acceptance workflow with escalation criteria and approver requirements for high-severity findings.

**`fortify-reporting`** — The portfolio use cases in `fortify-fod` and `fortify-ssc` return raw query data. This skill transforms that data into structured output: executive summaries with RAG status and immediate actions, compliance gap analysis mapped to PCI DSS v4.0, SOC 2, HIPAA, and OWASP Top 10 controls with per-control issue counts, trend analysis with remediation velocity across scan cycles, and automation of recurring reports via fcli custom actions with CI/CD pipeline integration patterns.

### What was added to existing skills

**`fortify-cicd-integration`** — The original skill covered GitHub Actions and GitLab CI. Two new reference files add the same depth for **Azure DevOps** (official Marketplace extension, task configuration, secret variable setup) and **Jenkins** (FoD Uploader plugin and SSC Fortify plugin, declarative pipeline patterns, `withCredentials` usage). Both files include repository investigation guidance before generating any pipeline code, and direct the agent to fetch current plugin documentation rather than guessing parameter names.

**`fortify-custom-rules`** — The original skill covered basic rulepack structure and SSC management. Seven additional reference files now cover the full rule authoring surface:

| Reference file added | What it covers |
|---|---|
| `taint-flags-reference.md` | Full catalog of General / Neutral / Specific taint flags; `<Conditional>` element syntax for sinks; partial and full cleanse patterns |
| `characterization-rules.md` | `CharacterizationRule` — structural predicates combined with taint operations; annotation-based source detection; `foreach` over matched items |
| `suppression-rules.md` | `SuppressionRule` for systematic FP elimination at rulepack level; `AliasRule` to extend coverage to custom wrapper types; `ResultFilterRule` |
| `external-metadata.md` | Mapping rules to CWE, OWASP Top 10 2021, PCI-DSS v4.0 via `external-metadata.xml`; loading alongside rulepacks in SSC |
| `content-config-rules.md` | `ContentRule` and `ConfigurationRule` for XML/JSON/YAML/properties files; XPath, regex, JSONPath, YAMLPath patterns; coverage by technology (Android, Docker, Kubernetes, Spring Boot, .NET, Django) |
| `control-flow-rules.md` | `ControlFlowRule` state machines for resource leaks, missing security checks, call-sequence violations, transaction lifecycle |
| `framework-function-identifiers.md` | Quick-reference tables of `className`/`functionName` for FunctionIdentifier blocks across Spring, JEE, ASP.NET Core, Django, Flask, Express, Go, and Rails |

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

The plugin registers all nine skills automatically.

### GitHub Copilot

Copy the skills to your Copilot skills directory (<user>/.copilot/skills/).  Skills will also be bundled with upcoming releases of Fortify IDE Plugins (VSCode, etc).

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

Then restart Codex. The plugin registers all nine skills automatically.

### Gemini CLI

Install directly from the GitHub repository:

```bash
gemini extensions install https://github.com/fortify/skills
```

The extension bundles all nine skills. Gemini CLI auto-discovers them and activates whichever skill is relevant to your task.

To test locally before publishing:

```bash
gemini extensions link /path/to/public
```

### Other AI assistants

Any assistant that supports the [Agent Skills](https://agentskills.io) standard can load skills from this directory. Point your assistant's skill path to the `skills/` subdirectory.

## Usage

Once installed, the skills activate automatically when relevant. Examples of prompts that trigger each skill:

| Prompt | Skill activated |
|--------|----------------|
| "Show me all critical issues in the payment-service release" | fortify-fod |
| "Upload my FPR and check policy compliance" | fortify-ssc |
| "Fix the SQL Injection findings in UserService.java" | fortify-remediate |
| "Add Fortify scanning to my GitHub Actions workflows" | fortify-cicd-integration |
| "Create a custom fcli action to export FoD critical issues as CSV" | fortify-fod + fcli-common |


## Resources

- [Fortify CLI (fcli) — GitHub](https://github.com/fortify/fcli)
- [Fortify on Demand documentation](https://www.microfocus.com/documentation/fortify-on-demand/)
- [Software Security Center documentation](https://www.microfocus.com/documentation/fortify-software-security-center/)

## License

MIT
