# Generic CI/CD Integration for Fortify on Demand / FoD (fcli ci action)

Use this approach when the target CI/CD platform has no official Fortify-managed action or plugin (e.g., Bitbucket Pipelines, Travis CI, CircleCI, TeamCity, Buildkite, Bamboo, Drone, or any custom pipeline that runs shell scripts).

## How it works

The fcli `ci` action (`fcli fod action run ci` or `fcli ssc action run ci`) is a built-in fcli action that runs a complete, standardized CI pipeline entirely via environment variables. It handles:

1. Creating or configuring the FoD release if it does not exist
2. Packaging source code using ScanCentral Client
3. Submitting the SAST scan request
4. Waiting for scan completion
5. Post-scan tasks: summary, policy check, PR/MR comments, results export

The pattern is always the same regardless of CI/CD platform:

```bash
# Step 1: Install fcli (adapt download URL for OS/arch if not linux-x64)
curl -sfL https://github.com/fortify/fcli/releases/latest/download/fcli-linux.tgz | tar -xz
chmod +x fcli
export PATH="$PWD:$PATH"

# Step 2: Set required environment variables (via the platform's secret/variable mechanism)
# See environment variable sections below — set these as CI secrets/variables, not inline

# Step 3: Run the ci action
fcli fod action run ci   # For Fortify on Demand
```

No explicit `fcli fod session login` or `logout` is needed — the `ci` action manages sessions internally using the environment variables.

## Official documentation

Fetch proactively when the user asks about a specific feature or variable not listed below: https://fortify.github.io/fcli/latest/fod-actions.html#_ci

## Environment variables

**Authentication & connection** — `FOD_URL` must NOT be masked/secret; the others should be stored as secrets.

| Variable(s) | Description |
|---|---|
| `FOD_URL` | FoD URL, e.g. `https://ams.fortify.com`. Store as a plain (non-secret) variable. |
| `FOD_TENANT`, `FOD_USER`, `FOD_PASSWORD` | Tenant user + PAT auth (preferred). `FOD_PASSWORD` should hold the Personal Access Token. |
| `FOD_CLIENT_ID`, `FOD_CLIENT_SECRET` | API key credentials (alternative to user+PAT; use one set or the other, never both). |

**Release management**

| Variable(s) | Description |
|---|---|
| `FOD_RELEASE` | Release as `<app>:<release>` or `<app>:<microservice>:<release>`. Defaults to `<repo-org/repo-name>:<branch>`. |
| `DO_SETUP` | Set to `false` to skip auto-creation of app/release (default: creates if not exists). |
| `COPY_FROM_RELEASE` | Copy scan state from another release when creating a new one (recommended for branch workflows). |
| `DO_AVIATOR_AUDIT` | Set to `true` to enable Aviator AI-assisted auditing (requires tenant entitlement). |
| `DO_SCA_SCAN` | Set to `true` to enable Software Composition Analysis alongside SAST. |

**Packaging & scan execution**

| Variable(s) | Description |
|---|---|
| `SOURCE_DIR` | Source directory to scan. Defaults to current working directory. |
| `PACKAGE_EXTRA_OPTS` | Extra options passed to `scancentral package` (e.g., `-bt mvn`). |
| `USE_PACKAGE` | Path to a pre-built package/MBS file — skips packaging if set. |
| `SC_CLIENT_VERSION` | ScanCentral Client version to use. Default: `latest`. |
| `DO_SAST_SCAN` | Set to `false` to skip the SAST scan submission. |
| `DO_WAIT` | Set to `false` to submit the scan without waiting for completion (skips post-scan tasks). |

**Post-scan tasks** (all optional)

| Variable(s) | Description |
|---|---|
| `DO_RELEASE_SUMMARY` | Set to `false` to skip the release summary output (default: enabled). |
| `DO_CHECK_POLICY` | Set to `true` to fail the build if the FoD security policy is not met. |
| `DO_SAST_EXPORT` | Auto-exports SAST results in a format matching the detected CI system. Set to `false` to disable. |
| `DO_PR_COMMENT` | (Preview) Set to `true` to post a PR/MR comment with new/changed issues. |

## Security rules for any platform

- **`FOD_URL` must never be stored as masked secrets.** The ci action reads them as plain text. A masked variable would cause authentication to fail silently.
- **Prefer user+PAT over API key credentials** unless the user explicitly requests API key auth. Never configure both sets simultaneously.
- **Store all credentials (tokens, passwords) as the platform's secret/masked variables**, not hardcoded in pipeline config files.
- **Ensure the build environment provides the required toolchain** before running the ci action. The action packages source code using ScanCentral Client, which needs the same build tools the project normally uses (e.g., Maven, Node.js, .NET SDK).

## Air-gapped environments

| Variable | Purpose |
|---|---|
| `FCLI_TGZ_URL` | Custom URL to download fcli from an internal mirror |
| `TOOL_DEFINITIONS` | Path to an internally hosted tool definitions zip (for ScanCentral Client, Debricked CLI) |
| `PREINSTALLED` | Set to `true` to require all supporting tools to already be installed; disables auto-download |
