# SCA Dependency Fix Planning

This reference covers **Phase 2 (planning)** for SCA/open source dependency findings from Fortify — vulnerabilities in third-party dependencies detected via software composition analysis. For Phase 4 (implementation), load `references/sca-implementation.md`.

SCA remediation is fundamentally different from SAST/DAST: the "fix" is almost always a **version upgrade** rather than a code change. The challenge is selecting the right version and managing the upgrade safely.

---

## Critical: Reliability Guardrails

SCA remediation involves version numbers, compatibility claims, and ecosystem-specific behaviors where incorrect information can cause real damage — broken builds, incomplete fixes, or false confidence. Follow these rules strictly:

- **Never guess or hallucinate version numbers.** Only use versions sourced from: Fortify issue recommendations, the project's package registry (npm registry, Maven Central, PyPI, NuGet Gallery, etc.), or the component's official release page. If you don't have a verified version number, tell the user.
- **Never claim a version is "safe" without evidence.** Cross-reference fix versions from the Fortify issue data, NVD advisories, GitHub Security Advisories, or the project's own security advisories.
- **Never fabricate changelogs, migration guides, or compatibility information.** If you haven't read the actual changelog or migration guide, do not summarize or paraphrase what changed between versions. Say what you don't know.
- **When uncertain, stop and say so.** It is far better to present "I'm not confident this version resolves CVE-XXXX — here's what I'd recommend verifying" than to proceed with a plausible but unverified fix.
- **Verify every change after making it.** Run the dependency tree command; confirm the vulnerable version is gone and the expected version is resolved. Never assume a manifest edit achieved what was intended.
- **Do not conflate ecosystems.** Each package manager has distinct version resolution, lockfile, and override semantics. If you're not certain how a specific package manager handles a situation, flag this to the user rather than applying patterns from a different ecosystem.

---

## Step 1: Collect All Issues for the Target Component

Before selecting a target version, you must know the full set of vulnerabilities affecting the component. A partial upgrade that fixes only some CVEs is worse than no upgrade — it creates a false sense of remediation.

```bash
# FoD — list all open SCA issues for a specific component
fcli fod issue list --rel=<releaseNameOrId> \
  --query "scanType=='OpenSource' && componentName matches '(?i).*log4j.*'" \
  --embed=summary,details -o json

# SSC — list all SCA issues for a component
fcli ssc issue list --av="<App:Version>" \
  --query "analyzer=='Open Source' && fullFileName matches '(?i).*log4j.*'" \
  -o json
```

> Component name matching may vary. If the first query returns no results, try matching on the issue category or by examining the issue's file field which often contains the dependency path.

Extract from each issue:
- CVE identifier(s)
- Affected version range (usually in the issue description or recommendations)
- Minimum safe version (the issue will typically recommend this)

### Step 1 → Step 2 gate

Before selecting a target version, confirm:

- [ ] All Fortify SCA issues for the target component have been retrieved
- [ ] Every CVE identifier and affected version range has been extracted
- [ ] The minimum safe version recommendation has been collected from each issue

Do NOT proceed to version selection with an incomplete CVE set. A partial upgrade that fixes some but not all CVEs creates false confidence.

---

## Step 2: Select the Target Version

After collecting all CVEs for the component, determine which upgrade scenario applies. Present the applicable options to the user — do not choose on their behalf.

### Option A: Minimum safe version
Upgrade to the **lowest version that resolves all CVEs** affecting the component. This minimizes the risk of breaking changes.

- Extract the minimum safe version from each issue's recommendations
- The safe version is the **highest** of all the minimum versions across all CVEs (upgrading to fix CVE-A but still being vulnerable to CVE-B is not acceptable)
- Example: CVE-A requires ≥ 2.15.0, CVE-B requires ≥ 2.17.0 → minimum safe is **2.17.0**

### Option B: Latest non-breaking version
Upgrade to the **latest version in the same major version** (or latest stable overall if a major bump is acceptable). This closes current CVEs and adds buffer against newly disclosed future CVEs.

Research publicly available CVE advisories (NVD, GitHub Security Advisories, the project's own changelog) to confirm the latest stable version is not itself vulnerable and does not introduce regressions.

### Option C: Major version bump required

If no version within the current major version resolves all CVEs, a major version upgrade is the only path to full remediation. This is a significantly higher-risk change that requires explicit user approval.

**Mixed scenarios are common**: some CVEs may be resolvable with a minor/patch update within the current major, but at least one CVE requires crossing a major version boundary. When this occurs:

1. **Confirm the major bump is truly required** — do not assume based on version numbering alone. Check the project's security advisories to verify that no minor/patch release backported the fix.
2. Check whether a **migration guide** exists for the major version transition.
3. Assess the **scope of API changes** between the current and target major versions.
4. Search the codebase for **direct usage** of the component's APIs (imports, method calls, configuration) to estimate the code changes needed.
5. **Present both paths to the user**:
   - *Partial remediation*: upgrade within the current major version to resolve the CVEs that can be fixed without a major bump. Clearly list which CVEs remain open.
   - *Full remediation*: upgrade to the new major version to resolve all CVEs. Include the estimated scope of required code changes and the breaking change risk assessment from Step 3.

Let the user decide which path to take. A partial remediation that resolves 3 of 4 CVEs with low risk may be preferable to a major version bump that introduces significant regression risk.

### Option D: No upgrade path available

Sometimes no version of the component resolves the vulnerability — the maintainers haven't released a fix, the project is abandoned, or the CVE affects a fundamental design aspect of the library.

When no upgrade path exists, present these alternatives to the user (the right choice is context-dependent — do not pick for them):

1. **Mitigating/compensating controls** — The vulnerability may be partially or fully mitigated by controls elsewhere in the application or infrastructure: input validation, network segmentation, WAF rules, access controls, or configuration hardening. Investigate whether the vulnerable code path is actually reachable in the application's deployment context.

2. **Replace the component** — Swap the vulnerable dependency for an alternative library that provides equivalent functionality. This is a significant change requiring code modifications at every call site and thorough testing. Only present this option when the component is clearly abandoned or the vulnerability is severe and unmitigable.

3. **Accept the risk (with documentation)** — If the CVE is not exploitable in the application's specific usage context (e.g., the vulnerable API is never called, the attack vector requires conditions that don't apply), the informed decision may be to accept the risk. This should include:
   - A documented explanation of why the CVE is not exploitable in this context
   - Setting the appropriate audit status in Fortify (e.g., "Not an Issue" with justification)
   - A plan to revisit when a fix becomes available or if the usage context changes

4. **Wait for a fix** — If the project is actively maintained and a fix is in progress, the pragmatic choice may be to wait. Document the open vulnerability, set a review date, and monitor the project's issue tracker or security advisories.

> **Do not default to "accept the risk"** without genuine analysis. If you cannot determine whether the CVE is exploitable in context, say so — this requires human judgment, not an assumption.

### Choosing the right option

Present the applicable options to the user with your assessment of risk and effort for each. Options A and B apply when a safe version exists within the current major line. Option C applies when a major bump is unavoidable. Option D applies when no version fixes the issue. In practice, a single component may have a mix — e.g., 3 CVEs fixable via Option A and 1 requiring Option C. Lay out the full picture and let the user decide.

### Step 2 → Step 3 gate

STOP. Do NOT proceed until the user has explicitly confirmed which upgrade option to pursue. Present your recommendation and wait for their response. Do not begin Step 3 or make any changes based on an assumed choice.

---

## Step 3: Assess Breaking Change Risk

Before upgrading, review the changelog and release notes for the component between the current version and the target version.

**Higher risk scenarios:**
- **Major version bump** (e.g., 1.x → 2.x) — APIs may be removed or changed; configuration format may change; behavior may differ
- **Minor version bump crossing a documented behavior change** — some projects note breaking changes in minor versions
- **Transitive dependency changes** — the upgraded component may pull in a new version of another library that conflicts with other dependencies

**Lower risk scenarios:**
- **Patch version bump within the same minor** (e.g., 2.17.0 → 2.17.1) — typically safe
- **Minor version bump with no stated breaking changes** — lower risk but still review

When a major version bump is required:
1. Note this explicitly in the remediation plan for user review
2. Check the migration guide if one exists
3. Check whether the affected dependency is used directly in the codebase (import statements / API calls) — if so, those call sites may need updating
4. Check if any other direct dependencies also declare a version range for this library that would conflict

### Phase 2 Completion Gate

Before presenting the plan in Phase 3, verify:

- [ ] Breaking change risk has been assessed for the full version range between current and target
- [ ] Direct vs. transitive status is known — if transitive, note this so it can be handled in Phase 4 (`references/sca-implementation.md` Step 5)
- [ ] If a **major version bump** is required: the user has explicitly approved this path (not just chosen Option C abstractly — confirmed the specific target version)
- [ ] If a migration guide exists for a major bump: it has been reviewed for breaking API changes affecting this codebase

Phase 2 is complete. Return to SKILL.md for Phase 3.
