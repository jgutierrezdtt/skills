---
name: fortify-cicd-integration
description: Generate or update CI/CD pipeline workflow files to integrate OpenText Fortify application security scanning (SAST, SCA) into GitHub Actions, GitLab CI, Azure DevOps, Jenkins, or any other CI/CD platform. Use this skill whenever the user asks to add Fortify to a pipeline, set up security scanning in CI/CD, configure a Fortify workflow file, or configure automated AppSec scanning within a pipeline or workflow file — even if they don't say "CI/CD" explicitly. Also use when the user asks about DevSecOps pipeline integration, shift-left security, or adding security gates to a build process — even if they don't mention Fortify by name, if the workspace contains Fortify-related configuration. Does NOT handle running ad-hoc or on-demand scans — use fortify-fod or fortify-ssc for that.
license: MIT
metadata:
  version: "1.0.0"
  tested-with:
    fcli: "3.18"
---

# Fortify CI/CD Integration

## Step 1: Investigate the repository first

Before asking the user anything or generating output, inspect the repository to determine context automatically.

### Detect the CI/CD platform

Look for these platform-specific files (check root and common subdirectories):

| Path / file | Platform |
|---|---|
| `.github/workflows/*.yml` | GitHub Actions |
| `.gitlab-ci.yml` | GitLab CI |
| `azure-pipelines.yml` | Azure DevOps |
| `Jenkinsfile` | Jenkins |
| `bitbucket-pipelines.yml` | Bitbucket Pipelines → generic fcli ci |
| `.travis.yml` | Travis CI → generic fcli ci |
| `.circleci/config.yml` | CircleCI → generic fcli ci |
| `teamcity-settings.kts` or `.teamcity/` | TeamCity → generic fcli ci |
| `.buildkite/pipeline.yml` | Buildkite → generic fcli ci |
| `bamboo-specs/` | Bamboo → generic fcli ci |

If multiple are present, note all of them and generate for whichever the user's request implies (or ask if ambiguous).

If no known platform file is found, use the **generic fcli `ci` action approach** — see [references/generic-ci.md](references/generic-ci.md).

### Detect the build tool and language

Check in this priority order:

1. **Existing CI/CD config files** — read the platform's existing workflow/pipeline files to find setup steps already in use. Extract the exact toolchain and version already specified — use these verbatim so the Fortify workflow matches the project's existing build environment.
2. **Build manifest files** — use the presence of files such as `requirements.txt`, `pom.xml`, `build.gradle`, `package.json`, `*.csproj`, `go.mod`, etc. to identify the language and build tooling required. Ensure the generated Fortify workflow includes any setup steps needed to successfully build the project with that toolchain. Refer to the platform-specific guidance file for the correct setup action/step syntax.

### Check for an existing Fortify configuration

Search for any existing Fortify-related files (`fortify.yml`, `fod.yaml`, files containing `fortify/github-action`, `fcli`, `FOD_`, `SSC_`) to understand whether Fortify is already partially configured and what credentials/variables are already referenced.

---

## Step 2: Clarify only what cannot be determined from code

After investigation, ask the user **only** for information that cannot be inferred from the repository or user prompt:

1. **Fortify platform** (required unless already stated in the user's request or present in an existing Fortify config): Fortify on Demand (FoD / cloud-hosted) or Fortify SSC (self-hosted / on-prem)?
2. **FoD region URL** — If not determinable from an existing Fortify configuration, default to `https://ams.fortify.com`. Only ask the user to confirm the region if there's reason to believe the default is wrong (e.g., user mentions EMEA, APAC, or GovCloud).
3. **Optional Features** — SCA (open source scanning) and Aviator (AI-assisted auditing) are enabled by default in the generated workflow. Policy checks (`DO_CHECK_POLICY`) and PR/MR comments (`DO_PR_COMMENT`) are disabled by default. Ask the user if they want to review and customize these optional features.

---

## Step 3: Confirm before generating

Before writing any workflow file, present a concise pre-generation summary and wait for the user to confirm:

```
CI/CD platform:      [e.g., GitHub Actions]
Fortify deployment:  [FoD / SSC]
Build toolchain:     [e.g., Maven 3.9 / Node.js 20 / .NET 8]
Existing Fortify config: [none / partially configured — describe]
Output file:         [e.g., .github/workflows/fortify.yml]
Scan types:          [SAST / SAST + SCA]
Optional features:   Aviator [on/off] · Policy check [on/off] · PR comments [on/off]
Auth method:         [FoD PAT / FoD API key / SSC token]
```

Then ask: **"Does this look right? Shall I generate the workflow?"**

Do NOT generate or write the workflow file until the user confirms. If any item above is still unknown after Step 1 and Step 2, resolve it before presenting this summary.

---

## General guidelines

- **Prefer the official Fortify managed action/plugin** for platforms that have one (GitHub Actions, GitLab CI, Azure DevOps, Jenkins). For all other platforms, use the generic fcli `ci` action approach — see [references/generic-ci.md](references/generic-ci.md).
- **Keep secrets in the platform's secret store**; hardcode or use variables only for non-sensitive configuration (e.g., Fortify server URL).
- **FOD_URL / SSC_URL must never be placed in secrets** — these are non-sensitive endpoints. Store as a repository/pipeline variable or hardcode directly.
- **Default to FoD PAT authentication** unless they explicitly request to use API client credentials (or API key). Only include user/password or Client Credentials, never use both.
- **Always include a permissions block** (where the platform supports it) with the minimum required permissions.
- **Pin action/plugin versions** to major version tags (e.g., `@v3`) for a balance of stability and automatic patch updates.
- **Never invent optional features, configuration settings or attributes** Always refer to the official documentation for the platform's Fortify action/plugin to ensure all inputs are valid and up-to-date. If documentation is unclear, default to the most basic configuration that will work and flag any uncertainties to the user.
- After generating the workflow, remind the user to configure the required secrets in their platform's secret management UI.

---

## Platform-specific guidance

| Platform | Fortify Deployment | Reference |
|---|---|---|
| GitHub Actions | FoD or SSC | See [references/github.md](references/github.md) |
| GitLab CI | FoD or SSC | See [references/gitlab.md](references/gitlab.md) |
| Azure DevOps | FoD or SSC | See [references/azure-devops.md](references/azure-devops.md) |
| Jenkins | FoD or SSC | See [references/jenkins.md](references/jenkins.md) |
| Azure DevOps | FoD or SSC | See **Azure DevOps** section below |
| Jenkins | FoD or SSC | See **Jenkins** section below |
| Any other platform | FoD or SSC | See [references/generic-ci.md](references/generic-ci.md) |

For GitHub Actions, GitLab CI, Azure DevOps, and Jenkins: read the appropriate platform-specific Markdown file before generating any output.

For all other platforms (Bitbucket Pipelines, Travis CI, CircleCI, TeamCity, Buildkite, Bamboo, etc.): read [references/generic-ci.md](references/generic-ci.md) before generating any output.

---

## Generic CI/CD integration

For platforms without an official Fortify-managed action or plugin (Bitbucket Pipelines, Travis CI, CircleCI, TeamCity, Buildkite, Bamboo, etc.), read [references/generic-ci.md](references/generic-ci.md) before generating any output. The generic approach uses the fcli `ci` action, which runs a complete scan pipeline driven entirely by environment variables.

---

## Post-generation checklist

After delivering the workflow file, confirm with the user:

- [ ] Secrets added to the platform secret store (`FOD_TENANT`, `FOD_USER`, `FOD_PAT` for FoD PAT auth; `FOD_CLIENT_ID`, `FOD_CLIENT_SECRET` for FoD API key auth; or `SSC_TOKEN`, `SC_SAST_TOKEN` for SSC)
- [ ] `FOD_URL` / `SSC_URL` configured as a repository/pipeline variable (not secret)
- [ ] Branch names in trigger conditions match the actual repository (verify these were pulled from existing workflows — if placeholders remain, flag them to the user)
