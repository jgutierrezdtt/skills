## Use Case: Open Source Component Analysis — Understanding OSS Usage and Risk

This use case covers open source software (OSS) risk and license analysis across a tenant portfolio or within a specific application:

- **Vulnerable component overview** — understand what vulnerable components are in use across the portfolio
- **Component usage investigation** — given a specific component (often triggered by a new CVE), find every app/release using it and the version(s) each is running
- **License risk review** — identify components with potentially risky license types (e.g., copyleft licenses like AGPL, GPL)
- **OSS inventory** — understand what open source components are in use, tenant-wide or per app/release
- **SBOM download** — export a release's software bill of materials in CycloneDX or SPDX format

OSS component data comes from the most recent software composition (SCA) scan on each release. Three scan source types are supported: `Debricked`, `Sonatype`, and `CycloneDx` (imported third-party results). The fcli default is Debricked only, but **unless the user asks for a specific source, always include all three** by passing `--scan-types=Debricked,Sonatype,CycloneDx`.

---

### Command Reference

```
fcli fod oss-scan list-components [--app=<appNameOrId>] [--rel=id|app[:ms]:rel]
    [--scan-types=<scanTypes>[,<scanTypes>...]]
    [-q=<SpEL expression>]
    [-o <format>]
```

**Key options:**

| Option | Description |
|--------|-------------|
| `--rel` | Scope to a specific release (`AppName:ReleaseName`, release ID, or `App:Microservice:Release`) |
| `--app` | Scope by application name or ID — **see caveat below** |
| `--scan-types` | Source(s) to include: `Debricked`, `Sonatype`, `CycloneDx` — default is `Debricked` only; **always pass `--scan-types=Debricked,Sonatype,CycloneDx` unless the user specifies a source** |
| `-q` | SpEL filter expression applied client-side |

> **Important — `--app` does not filter server-side.** The FoD REST API does not yet support filtering by application. Specifying `--app` currently returns OSS components for **all applications** in the tenant. Use `-q` with SpEL to filter by app or release name in the result set.

**Key filterable fields** (from the command description; additional fields depend on actual scan data):

| Field | Type | Description |
|-------|------|-------------|
| `isVulnerable` | boolean | Component has known vulnerabilities |
| `licenseSummary` | string | License type(s) for the component (e.g., `"MIT"`, `"Apache-2.0"`, `"AGPL-3.0"`) |

> Other fields (component name, version, CVE identifiers, severity, app/release identifiers) will be present in the output but exact field names are provisional while the command is in preview. Run `fcli fod oss-scan list-components -o json` and inspect the output to discover available fields before constructing complex queries.

---

### Scenario 1: Vulnerable Component Overview — What OSS Risk Exists Across the Portfolio?

The user wants a broad sense of which releases have vulnerable open source components — either as a starting point before diving into a specific component, or to understand overall OSS risk exposure.

**Quick summary using release-level aggregate counts** (fast, no component-level detail needed):
```bash
fcli fod release list -o json
# → fields: openSourceCritical, openSourceHigh, openSourceMedium, openSourceLow
```

Sort or filter to identify releases with the highest open source vulnerability counts. This is the recommended starting point for portfolio-level OSS risk — no component queries required.

**List all vulnerable components across the tenant** (for component-level detail):
```bash
fcli fod oss-scan list-components --scan-types=Debricked,Sonatype,CycloneDx -q isVulnerable -o json
```

Summarize: which releases carry the most vulnerable components, how many are critical/high severity, which components appear most frequently. Do not display raw JSON to the user.

> From here, a user may want to pivot to Scenario 2 to investigate a specific component in depth — or to the Issue Investigation use case to triage the underlying vulnerabilities.

---

### Scenario 2: Component Usage Investigation — Where Is This Component Used?

The user wants to find every app/release using a specific component — most commonly triggered by a newly published CVE. The goal is to know exactly which releases are exposed and what version each is running, so the right teams can be alerted.

Because version numbering varies widely across components and ecosystems, **report a list of app/release + version pairs** rather than filtering by version up front. Let the user assess which versions are affected once they see what's in use.

**Step 1 — Find all releases using the component** (inspect field names first; adjust if the output uses a different key such as `name` or `packageName`):
```bash
# Adjust the field name (e.g., componentName, name, packageName) based on actual output
fcli fod oss-scan list-components --scan-types=Debricked,Sonatype,CycloneDx \
  -q "componentName matches '(?i).*log4j.*'" -o json
```

**Step 2 — Summarize as a table: app name, release name, component version in use.** Do not display raw JSON. Example summary format:

| Application | Release | Component | Version |
|-------------|---------|-----------|---------|
| payments-api | main | log4j-core | 2.14.1 |
| auth-service | v3.2 | log4j-core | 2.17.0 |
| legacy-portal | main | log4j | 2.14.1 |

**Step 3 — If needed, narrow by version** (once the user knows what versions are in the wild):
```bash
fcli fod oss-scan list-components --scan-types=Debricked,Sonatype,CycloneDx \
  -q "componentName matches '(?i).*log4j.*' && version matches '2\\.14.*'" \
  -o json
```

> Because the component list is tenant-wide by default, this approach covers the entire portfolio in a single query — no need to iterate release by release.

> A user may arrive here directly (jumping straight to a specific component) or may start with Scenario 1 (portfolio overview) and then pivot here to investigate a flagged component.

---

### Scenario 3: License Risk Review

The user wants to identify components with potentially problematic licenses — typically copyleft licenses (AGPL, GPL, LGPL, SSPL) that impose strong reciprocal obligations, or licenses with ambiguous terms. 

**Find all components with AGPL licenses:**
```bash
fcli fod oss-scan list-components --scan-types=Debricked,Sonatype,CycloneDx \
  -q 'licenseSummary matches "(?i).*AGPL.*"' -o json
```

**Check for well-known copyleft or high-risk license types:**
```bash
fcli fod oss-scan list-components --scan-types=Debricked,Sonatype,CycloneDx \
  -q 'licenseSummary matches "(?i).*(AGPL|GPL-3|SSPL|EUPL|OSL).*"' \
  -o json
```

**Find components with no license information:**
```bash
fcli fod oss-scan list-components --scan-types=Debricked,Sonatype,CycloneDx \
  -q 'licenseSummary == null || licenseSummary == ""' \
  -o json
```

Summarize: group by license type, highlight which apps/releases are exposed, and call out the most commonly used high-risk licenses. Do not display raw JSON to the user.

**Scope to a single application or release** — despite the `--app` API limitation, you can filter client-side:
```bash
# All components for a specific release
fcli fod oss-scan list-components --rel="AppName:ReleaseName" \
  --scan-types=Debricked,Sonatype,CycloneDx \
  -q 'licenseSummary matches "(?i).*GPL.*"' \
  -o json

# Client-side app filter (workaround for missing server-side filtering)
fcli fod oss-scan list-components --scan-types=Debricked,Sonatype,CycloneDx \
  -q 'applicationName=="MyApp" && licenseSummary matches "(?i).*GPL.*"' \
  -o json
```

> For more comprehensive analysis of license risk, use https://spdx.org/licenses/ to inform local analysis of json output.

---

### Scenario 4: OSS Inventory — What Components Are in Use?

The user wants a broad view of open source component usage — either for a specific application or across the portfolio.

**All components for a specific release:**
```bash
fcli fod oss-scan list-components --rel="AppName:ReleaseName" \
  --scan-types=Debricked,Sonatype,CycloneDx -o json
```

**All components across the tenant** (may be large; consider filtering):
```bash
fcli fod oss-scan list-components --scan-types=Debricked,Sonatype,CycloneDx -o json
```

**Only vulnerable components, tenant-wide:**
```bash
fcli fod oss-scan list-components --scan-types=Debricked,Sonatype,CycloneDx -q isVulnerable -o json
```

**Scope to a specific scan source** (only when the user explicitly requests it):
```bash
fcli fod oss-scan list-components --scan-types=Sonatype -o json
fcli fod oss-scan list-components --scan-types=CycloneDx -o json
```

Summarize: total number of components, how many are vulnerable, breakdown by license category, top apps by OSS risk. Do not display raw JSON to the user.

---

### Checking Whether OSS Scanning Is Configured

OSS component data is only available if SCA scans have run. Check per-release OSS scan status before querying components:

```bash
# Check OSS scan status for a specific release
fcli fod oss-scan get --rel="AppName:ReleaseName" -o json

# Releases with open source vulnerability counts at the portfolio level
fcli fod release list -o json
# → use fields: openSourceCritical, openSourceHigh, openSourceMedium, openSourceLow

# Check whether Debricked is enabled for a release
fcli fod release get "AppName:ReleaseName" -o json
# → field: IsDebrickedScanEnabled
```

Releases where all `openSource*` counts are zero and `IsDebrickedScanEnabled` is false likely have no OSS scan configured.

---

### Scenario 5: SBOM Download — Exporting Scan Results for a Release

The user wants to download a software bill of materials (SBOM) for a specific release in a standard format for use in other tools, compliance reporting, or supply chain analysis.

```
fcli fod oss-scan download-latest --rel=id|app[:ms]:rel -f=<file> [--format=<format>]
```

| Option | Description |
|--------|-------------|
| `--rel` | Release identifier (`AppName:ReleaseName`, release ID, or `App:Microservice:Release`) |
| `-f` | Output file path and name (e.g., `sbom.json`) |
| `--format` | `CycloneDX` (default) or `SPDX` |

**Download the latest OSS scan results as CycloneDX** (default format):
```bash
fcli fod oss-scan download-latest --rel="AppName:ReleaseName" -f sbom-cyclonedx.json
```

**Download in SPDX format:**
```bash
fcli fod oss-scan download-latest --rel="AppName:ReleaseName" -f sbom-spdx.json --format=SPDX
```

If the user hasn't specified a release, resolve it first using the Application Context use case before running this command. If no OSS scan has been completed for the release, this command will fail — check scan status with `fcli fod oss-scan get --rel="AppName:ReleaseName"` first.

---

### Output and Field Discovery (Preview Caution)

Because this command is in preview, inspect actual output before writing complex queries:

```bash
# Retrieve a small sample and examine fields
fcli fod oss-scan list-components --rel="AppName:ReleaseName" -o json | head -c 5000
```

Use the discovered field names in subsequent `-q` expressions. If a field appears to be missing or named differently than expected, adapt accordingly.
