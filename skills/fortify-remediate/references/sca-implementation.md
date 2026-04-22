# SCA Dependency Implementation

This reference covers **Phase 4 (implementation)** for SCA/open source dependency findings — editing package manifests, handling transitive dependencies, and verifying the fix. For Phase 2 (planning), see `references/sca-fix-planning.md`.

---

## Step 4: Update the Dependency Manifest

Make the version change in the appropriate manifest file. Match the existing style (comments, version format, file structure).

### By Package Manager

**Maven (`pom.xml`)**
```xml
<!-- Update version property or direct dependency version -->
<dependency>
  <groupId>org.apache.logging.log4j</groupId>
  <artifactId>log4j-core</artifactId>
  <version>2.17.1</version>  <!-- updated from 2.14.1 -->
</dependency>
```
If versions are managed via a `<properties>` block or a parent BOM, update the property/BOM version instead. After updating: `mvn dependency:tree` to confirm the resolved version.

**Gradle (`build.gradle` / `build.gradle.kts`)**
```groovy
implementation 'org.apache.logging.log4j:log4j-core:2.17.1'
```
After updating: `./gradlew dependencies --configuration runtimeClasspath` to confirm.

**npm / yarn (`package.json`)**
```json
"dependencies": {
  "lodash": "4.17.21"
}
```
Then: `npm install` or `yarn install`. Use `npm ls <package>` to verify the resolved version including transitive installs.

**pip (`requirements.txt` / `pyproject.toml`)**
```
requests>=2.31.0
```
Or for pinned: `requests==2.31.0`. After updating: `pip install -r requirements.txt` and `pip show requests` to verify.

**NuGet (`*.csproj` / `packages.config`)**
```xml
<PackageReference Include="Newtonsoft.Json" Version="13.0.3" />
```
After updating: `dotnet restore` and `dotnet list package` to verify.

**Go (`go.mod`)**
```
require golang.org/x/net v0.17.0
```
After updating: `go mod tidy` to update `go.sum` and verify resolution.

**Ruby (`Gemfile`)**
```ruby
gem 'nokogiri', '~> 1.16.2'
```
After updating: `bundle update <gem>` and `bundle exec gem list <gem>` to verify. Check `Gemfile.lock` for the resolved version.

**PHP Composer (`composer.json`)**
```json
"require": {
  "guzzlehttp/guzzle": "^7.8.1"
}
```
After updating: `composer update <package>` and `composer show <package>` to verify.

> **Other ecosystems**: The examples above cover common package managers encountered in Fortify SCA findings. The same principles apply to any ecosystem: update the version constraint in the manifest file, run the package manager's install/update command, then verify the resolved version using the dependency tree or list command. If you encounter a package manager not listed here, apply the general pattern but verify the exact commands from the package manager's documentation — do not guess syntax from a different ecosystem.

---

## Step 5: Handle Transitive Dependencies

Not all SCA findings are on **direct** dependencies. Some are on transitive dependencies (dependencies of your dependencies). The fix approach differs significantly.

### Determining Direct vs. Transitive

First, determine whether the vulnerable component is a direct dependency (declared explicitly in the project's manifest file) or transitive (pulled in by another dependency). Check the manifest file first — if the component is listed there, it's direct. If not, use the dependency tree to trace how it's included.

Every major package manager provides a way to inspect the dependency tree:

```bash
# Maven — full tree; search for the vulnerable artifact
mvn dependency:tree | grep -B5 "<vulnerable-artifact>"

# Gradle — filterable dependency report
./gradlew dependencies --configuration runtimeClasspath | grep -B5 "<vulnerable-artifact>"

# npm — shows the dependency chain for a specific package
npm ls <vulnerable-package>

# pip — requires pipdeptree (install via: pip install pipdeptree)
pipdeptree -r -p <vulnerable-package>

# NuGet — shows transitive dependencies
dotnet list package --include-transitive | Select-String "<vulnerable-package>"

# Go — shows why a module is required and what imports it
go mod why <module-path>
go mod graph | Select-String "<vulnerable-module>"

# Ruby (Bundler) — reverse dependency lookup
bundle exec gem dependency <gem-name> --reverse-dependencies

# PHP (Composer) — shows what depends on a package
composer depends <vendor/package>
```

> **General principle**: If your package manager isn't listed above, look for its equivalent of "show dependency tree" or "why is this package included" — virtually every modern package manager has one. Do not guess the command; check the package manager's documentation.

### Fixing Transitive Vulnerabilities

Options in order of preference:

1. **Upgrade the parent direct dependency** to a version that already uses a safe transitive version. This is the cleanest fix — it keeps the dependency graph natural and avoids version pinning.

2. **Add a direct dependency override** to force the transitive dependency to a safe version. The mechanism is ecosystem-specific:
   - **Maven**: `<dependencyManagement>` section in `pom.xml`
   - **Gradle**: `resolutionStrategy.force` or `constraints` block
   - **npm** (8.3+): `overrides` field in `package.json`
   - **yarn**: `resolutions` field in `package.json`
   - **pip**: Add the transitive dependency directly to `requirements.txt` with a pinned safe version
   - **NuGet**: Add a direct `<PackageReference>` in the `.csproj` to override the transitive version
   - **Go**: `replace` directive in `go.mod`
   - **Ruby**: Add the gem directly to `Gemfile` with a version constraint
   - **PHP**: Add the package to `composer.json` `require` with a version constraint

3. **If neither option works** — the parent dependency hasn't released a fix and the override causes version conflicts — this is effectively a "no upgrade path" scenario. Return to Step 2 in `references/sca-fix-planning.md`, Option D and present the alternatives to the user.

**Always prefer option 1 when available** — overrides add maintenance burden and can mask compatibility issues. Use overrides only when the direct parent hasn't released a fix, and always confirm with the user before adding one.

---

## Step 6: Build and Verify

After updating the manifest:

1. **Restore/install dependencies** — run the package manager install command for the ecosystem
2. **Verify the resolved version** — confirm the vulnerable version is no longer in the dependency tree (see commands in Step 4)
3. **Build the project** — dependency updates can introduce compilation errors if APIs changed
4. **Run the test suite** — runtime behavior changes in a library may surface as test failures; these are important regressions to catch before deployment

If the build fails or tests regress, assess whether the failure is:
- A **compilation error** from an API change → update call sites in the application code
- A **behavior change** surfacing in tests → investigate whether it's a test that needs updating or a real regression
- A **transitive conflict** → check for version conflicts with other dependencies

Report build/test status to the user before considering the remediation complete.

### Verification Checklist

Before reporting a dependency remediation as complete, confirm all of the following:

- [ ] Dependency tree shows the vulnerable version is **completely absent** (not merely supplemented by a second, safe version alongside the vulnerable one)
- [ ] The expected safe version is resolved in the dependency tree
- [ ] The project builds without errors
- [ ] The test suite passes (or any failures are explained and unrelated to the dependency change)
- [ ] If a lockfile exists (`package-lock.json`, `yarn.lock`, `Gemfile.lock`, `poetry.lock`, `go.sum`, `composer.lock`, etc.), it has been regenerated and reflects the change

**Do not report a dependency remediation as complete based solely on editing the manifest file.** The manifest declares intent; the resolved dependency tree is the source of truth.

---

## Code Comment Guideline

A brief comment in the dependency manifest noting the CVE being addressed is acceptable and recommended (e.g., `# CVE-2021-44228 — minimum safe version`). Do not add CVE references to application source files.

---

Phase 4 is complete. Return to SKILL.md for the Completion Summary.
