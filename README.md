# OpenText Fortify Skills

AI agent skills that teach Claude, GitHub Copilot and other AI agents how to use [OpenText Fortify](https://www.opentext.com/products/application-security) effectively — covering SAST/DAST/SCA scanning, vulnerability triage, audit workflows, CI/CD integration, FCLI commands and more.

## Skills

| Skill | Description |
|-------|-------------|
| **fortify-fod** | Fortify on Demand (SaaS) — applications, releases, scans, issues, OSS analysis, portfolio reporting |
| **fortify-ssc** | Software Security Center (on-premise) — manage application versions, artifacts, scan jobs, issue triage |
| **fortify-remediate** | Fix vulnerabilities detected by Fortify — SAST, DAST, and SCA findings; Aviator AI remediation |
| **fortify-cicd-integration** | Add Fortify scanning to CI/CD pipelines — GitHub Actions, GitLab CI, Azure DevOps, Jenkins |
| **fcli-common** | Fortify CLI (fcli) — installation, authentication, output formats, SpEL queries, custom actions |

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

The plugin registers all five skills automatically.

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

Then restart Codex. The plugin registers all five skills automatically.

### Gemini CLI

Install directly from the GitHub repository:

```bash
gemini extensions install https://github.com/fortify/skills
```

The extension bundles all five skills. Gemini CLI auto-discovers them and activates whichever skill is relevant to your task.

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
