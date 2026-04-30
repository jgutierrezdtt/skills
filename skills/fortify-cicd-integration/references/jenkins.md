# Jenkins — Fortify Integration

## Contents
- [Official documentation — fetch when needed](#official-documentation--fetch-when-needed)
- [Repository investigation](#repository-investigation)
- [Plugin installation](#plugin-installation)
- [FoD: Fortify on Demand](#fod-fortify-on-demand)
- [SSC: Fortify Software Security Center](#ssc-fortify-software-security-center)
- [Critical rules](#critical-rules)
- [Credentials configuration](#credentials-configuration)

---

## Official documentation — fetch when needed

Do **not** rely solely on this file for step names, configuration parameters, or supported versions. Fetch the relevant plugin page before generating any Jenkinsfile content. Plugin parameters change between versions; do not guess them.

| Need | URL to fetch |
|---|---|
| FoD plugin documentation, step names, and parameters | https://plugins.jenkins.io/fortify-on-demand-uploader/ |
| SSC plugin documentation, step names, and parameters | https://plugins.jenkins.io/fortify/ |
| General fcli ci action reference (alternative approach) | https://fortify.github.io/fcli/latest/fod-actions.html#_ci |

Fetch the plugin page before generating Jenkinsfile content. If the plugin page is unavailable, fall back to the generic fcli `ci` action approach (see `references/generic-ci.md`) and inform the user.

---

## Repository investigation

Before generating any Jenkinsfile content, inspect the repository.

### 1. Find existing Jenkinsfile

Read the `Jenkinsfile` at the repository root (or `Jenkinsfile.*` variants). Extract:

- **Agent specification** (`agent { label '...' }` or `agent { docker { ... } }`) — match exactly; do not change the agent.
- **Existing build stages and steps** — reproduce the exact tool invocations already in use (e.g., `sh 'mvn clean package'`, `sh 'npm ci'`). The Fortify stage must use the same build environment.
- **Existing `environment {}` block** — note any variables already declared; do not redeclare them.
- **Credentials already bound** (`withCredentials`, `credentialsId`) — note existing credential IDs to maintain naming consistency.
- **Branch conditions** (`when { branch '...' }`) — carry forward existing branch conditions rather than using placeholders.
- **Any existing Fortify steps** — if the Jenkinsfile already contains Fortify plugin steps, read the current configuration before modifying.

### 2. Detect build tool from source files (fallback)

Only needed if no Jenkinsfile exists. Check the repository root for build manifests (`pom.xml`, `build.gradle`, `package.json`, `requirements.txt`, `*.csproj`, `go.mod`, etc.).

---

## Plugin installation

Direct the user to install the appropriate plugin before generating any Jenkinsfile content:

| Fortify deployment | Plugin | URL |
|---|---|---|
| Fortify on Demand (FoD) | Fortify on Demand Uploader | https://plugins.jenkins.io/fortify-on-demand-uploader/ |
| Fortify SSC | Fortify | https://plugins.jenkins.io/fortify/ |

Plugins are installed via **Jenkins > Manage Jenkins > Plugin Manager**. Installation requires a Jenkins administrator. After directing the user to install, fetch the plugin documentation page to confirm current step names and parameter names before generating any pipeline content.

---

## FoD: Fortify on Demand

After installing the plugin and fetching the current step reference, generate a declarative pipeline stage using the official FoD plugin step. The general structure is:

```groovy
pipeline {
    agent any   // replace with the agent from the existing Jenkinsfile

    environment {
        FOD_URL = 'https://ams.fortify.com'   // not a secret — hardcode or use a parameter
    }

    stages {
        // Add existing build stages here, matching the project's Jenkinsfile

        stage('Fortify Scan') {
            steps {
                withCredentials([
                    string(credentialsId: 'FOD_TENANT',  variable: 'FOD_TENANT'),
                    string(credentialsId: 'FOD_USER',    variable: 'FOD_USER'),
                    string(credentialsId: 'FOD_PAT',     variable: 'FOD_PAT')
                ]) {
                    // Use the correct plugin step name from the documentation
                    // Do not guess step names or parameter names — fetch the plugin page first
                }
            }
        }
    }
}
```

Fetch the full step reference before filling in the step block. Present the pre-generation summary to the user and wait for confirmation before writing the Jenkinsfile.

---

## SSC: Fortify Software Security Center

After installing the plugin and fetching the current step reference, generate a declarative pipeline stage using the official SSC plugin step. The general structure is:

```groovy
pipeline {
    agent any   // replace with the agent from the existing Jenkinsfile

    environment {
        SSC_URL = 'https://my-ssc.example.com'   // not a secret — hardcode or use a parameter
    }

    stages {
        // Add existing build stages here, matching the project's Jenkinsfile

        stage('Fortify Scan') {
            steps {
                withCredentials([
                    string(credentialsId: 'SSC_TOKEN',      variable: 'SSC_TOKEN'),
                    string(credentialsId: 'SC_SAST_TOKEN',  variable: 'SC_SAST_TOKEN')
                ]) {
                    // Use the correct plugin step name from the documentation
                    // Do not guess step names or parameter names — fetch the plugin page first
                }
            }
        }
    }
}
```

---

## Critical rules

- **Never hardcode secrets.** Store `FOD_TENANT`, `FOD_USER`, `FOD_PAT` (FoD) or `SSC_TOKEN`, `SC_SAST_TOKEN` (SSC) as Jenkins Secret Text credentials. Reference them via `withCredentials` — never as plain environment variables or hardcoded strings.
- **`FOD_URL` / `SSC_URL` are not secrets.** Hardcode directly in the `environment {}` block or use a pipeline parameter.
- **Do not guess step or parameter names.** Both plugins have changed their APIs across major versions. Always fetch the plugin documentation before generating steps.
- **Match the existing agent.** Do not change the `agent` directive — the build environment must match the project's existing Jenkinsfile.
- If the plugin is unavailable or the user prefers a shell-based approach, use the generic fcli `ci` action instead — see `references/generic-ci.md`.

---

## Credentials configuration

After delivering the Jenkinsfile, confirm with the user:

- [ ] Plugin installed via Jenkins Plugin Manager
- [ ] Secret Text credentials created in Jenkins: `FOD_TENANT`, `FOD_USER`, `FOD_PAT` (FoD) or `SSC_TOKEN`, `SC_SAST_TOKEN` (SSC)
- [ ] Credential IDs in the Jenkinsfile match the IDs created in Jenkins
- [ ] `FOD_URL` / `SSC_URL` set as plain environment variable (not a credential)
- [ ] Branch conditions in the Jenkinsfile verified against the actual repository
