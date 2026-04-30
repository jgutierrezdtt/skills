# Azure DevOps — Fortify Integration

## Contents
- [Official documentation — fetch when needed](#official-documentation--fetch-when-needed)
- [Repository investigation](#repository-investigation)
- [Extension installation](#extension-installation)
- [FoD: Fortify on Demand](#fod-fortify-on-demand)
- [SSC: Fortify Software Security Center](#ssc-fortify-software-security-center)
- [Critical rules](#critical-rules)
- [Secrets configuration](#secrets-configuration)

---

## Official documentation — fetch when needed

Do **not** rely solely on this file for complete task input names, versions, or advanced configuration options. Fetch the relevant URL on demand before generating any pipeline YAML. Extension inputs change with releases; do not guess them.

| Need | URL to fetch |
|---|---|
| Extension overview, task names, and current version | https://marketplace.visualstudio.com/items?itemName=fortifyvsts.hpe-security-fortify-vsts |
| FoD task inputs and configuration reference | https://github.com/fortify/fortify-integration-azure-devops |
| General fcli ci action reference (alternative approach) | https://fortify.github.io/fcli/latest/fod-actions.html#_ci |

Fetch before generating pipeline YAML. If the marketplace page is unavailable, fall back to the generic fcli `ci` action approach (see `references/generic-ci.md`) and inform the user.

---

## Repository investigation

Before generating any pipeline YAML, inspect the repository to determine context.

### 1. Find existing pipelines

Check for `azure-pipelines.yml` in the repository root and common subdirectories. Read it and extract:

- **Pool / agent specification** (`pool:` block with `vmImage` or `name`) — match the existing agent pool; do not change it.
- **Existing build and setup steps** — reproduce the exact tasks and versions already in use (e.g., `UsePythonVersion@0`, `Maven@4`, `DotNetCoreCLI@2`). The Fortify pipeline must use the same build environment.
- **Trigger configuration** (`trigger:`, `pr:`, `schedules:`) — carry forward the existing branch names and trigger conditions rather than using placeholders.
- **Variable groups and existing secret references** — note what is already in scope; do not redeclare them.
- **Any existing Fortify tasks** — if a `FortifyOnDemand` or `Fortify` task already exists, read it to understand current configuration before modifying.

### 2. Detect build tool from source files (fallback)

Only needed if no existing pipeline defines the build environment. Check the repository root for build manifests (`pom.xml`, `build.gradle`, `package.json`, `requirements.txt`, `*.csproj`, `go.mod`, etc.) and select the corresponding Azure DevOps task.

---

## Extension installation

Direct the user to install the official extension before generating any pipeline content:

**Extension name:** OpenText Fortify on Azure DevOps Marketplace
**URL:** https://marketplace.visualstudio.com/items?itemName=fortifyvsts.hpe-security-fortify-vsts

The extension must be installed at the organization level by an Azure DevOps administrator. It provides the `FortifyOnDemand` and `Fortify` pipeline tasks. Fetch the marketplace page to confirm the current task names and major version before generating YAML.

---

## FoD: Fortify on Demand

After installing the extension and fetching the current task reference, generate a pipeline using the official `FortifyOnDemand` task. The general structure is:

```yaml
trigger:
  branches:
    include:
      - main        # replace with branch names from the existing pipeline

pool:
  vmImage: ubuntu-latest   # replace with the pool from the existing pipeline

variables:
  FOD_URL: https://ams.fortify.com   # not a secret — hardcode or set as pipeline variable

steps:
  - checkout: self

  # Add build setup steps matching the project's existing pipeline here

  - task: FortifyOnDemand@<version>   # replace <version> with current task major version
    inputs:
      # Fetch required inputs from the extension documentation URL above
      # Do not guess input names — they change between major versions
    env:
      FOD_TENANT:     $(FOD_TENANT)
      FOD_USER:       $(FOD_USER)
      FOD_PAT:        $(FOD_PAT)
```

Fetch the full input reference before filling in the `inputs:` block. Present the pre-generation summary to the user and wait for confirmation before writing the file.

---

## SSC: Fortify Software Security Center

After installing the extension and fetching the current task reference, generate a pipeline using the official `Fortify` task. The general structure is:

```yaml
trigger:
  branches:
    include:
      - main        # replace with branch names from the existing pipeline

pool:
  vmImage: ubuntu-latest   # replace with the pool from the existing pipeline

variables:
  SSC_URL: https://my-ssc.example.com   # not a secret — hardcode or set as pipeline variable

steps:
  - checkout: self

  # Add build setup steps matching the project's existing pipeline here

  - task: Fortify@<version>   # replace <version> with current task major version
    inputs:
      # Fetch required inputs from the extension documentation URL above
      # Do not guess input names — they change between major versions
    env:
      SSC_TOKEN:       $(SSC_TOKEN)
      SC_SAST_TOKEN:   $(SC_SAST_TOKEN)
```

Fetch the full input reference before filling in the `inputs:` block.

---

## Critical rules

- **Never hardcode secrets.** Store `FOD_TENANT`, `FOD_USER`, `FOD_PAT` (FoD) or `SSC_TOKEN`, `SC_SAST_TOKEN` (SSC) as Azure DevOps pipeline secret variables or in a variable group linked to Azure Key Vault.
- **`FOD_URL` / `SSC_URL` are not secrets.** Store them as plain pipeline variables or hardcode directly in the YAML.
- **Do not guess task input names.** The extension tasks use different input names across major versions. Always fetch the current documentation before generating inputs.
- **Match the existing agent pool.** Do not change `vmImage` or `name` in the pool block — the build environment must match the project's other pipelines.
- If the extension is unavailable or the user prefers a shell-based approach, use the generic fcli `ci` action instead — see `references/generic-ci.md`.

---

## Secrets configuration

After delivering the pipeline file, confirm with the user:

- [ ] Extension installed at organization level
- [ ] Secret variables created in the pipeline or variable group: `FOD_TENANT`, `FOD_USER`, `FOD_PAT` (FoD) or `SSC_TOKEN`, `SC_SAST_TOKEN` (SSC)
- [ ] `FOD_URL` / `SSC_URL` set as plain pipeline variable (not secret)
- [ ] Branch names in trigger conditions verified against the actual repository
