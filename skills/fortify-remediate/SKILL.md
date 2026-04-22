---
name: fortify-remediate
description: Remediate security vulnerabilities detected by Fortify (SAST, DAST, and SCA/open source). Use whenever a user asks to fix, remediate, or resolve Fortify findings — whether targeted ("fix issue 12345", "fix all SQL Injection issues in UserService.java", "upgrade the vulnerable Log4j dependency") or general ("fix the top critical issues", "clean up the SSL/TLS configuration issues", "reduce our Fortify findings"). Also triggers when the user wants to apply Aviator AI remediation guidance to code, or wants to reduce Fortify issue counts by making code or configuration changes — even if the user hasn't explicitly identified specific issues yet. Any request that implies code changes to address security findings should use this skill. Works with both FoD (Fortify on Demand) and SSC (Software Security Center). For broad issue querying, triage, or audit decisions without code changes, use the fortify-fod or fortify-ssc skills instead.
license: MIT
metadata:
  version: "1.0.0"
  tested-with:
    fcli: "3.18"
    fod: "26.1"
    ssc: "25.4"
---

# Fortify Remediation

You interact with Fortify using `fcli`. It must already be on the PATH. If it is not installed, activate the `fcli-common` skill for installation instructions.

Remediating Fortify findings is a 4-phase process. Work through phases in order — each phase has a clear entry condition and output that feeds the next.

> **Stay within the documented workflow.** Do not proactively offer side-quests or capabilities that aren't part of the phase you're in — e.g., don't volunteer to download or extract source from an FPR, set up CI/CD scanning, reconfigure scan settings, create custom actions, or open bug-tracker tickets unless the user asks. If a step in this skill calls for it, do it; if not, don't surface it as an option. Eager suggestions waste the user's attention and lead them off the remediation path.

---

## Phase 0: Establish Context

Before any remediation work, confirm these three things:

**1. Platform** — Run both session checks to determine which platform is active:

```bash
fcli fod session ls --query "expired=='No'"
fcli ssc session ls --query "expired=='No'"
```

- If only a FoD session is active → use FoD; activate the `fortify-fod` skill.
- If only an SSC session is active → use SSC; activate the `fortify-ssc` skill.
- If both are active → ask the user which platform they want to use.
- If neither is active → ask the user which platform they are using, then activate the appropriate platform skill to log in.

The platform determines which commands you use and whether Aviator guidance is available.

**2. Target release or application version** — You need this to query issue data. If the user hasn't provided it, use the platform skill (already activated in Step 1) to resolve it. The platform skill handles authentication verification and provides the right name-resolution and issue retrieval commands.

> **ID usage — do not invent flags:** When the user supplies a numeric ID, use it directly and skip name resolution.
> - FoD: `--rel=<numericReleaseId>` — there is no separate `--app` or `--release` flag.
> - SSC: `--av=<numericVersionId>` — there is no separate `--app` or `--version` flag.

**3. What to fix** — Has the user given a specific target? Map it to one of these:
- **Specific issue IDs** — User provided explicit Fortify issue IDs
- **Category/file filter** — "all SQL Injection issues", "issues in PaymentController.java"
- **Component/dependency** — "fix the Jackson Databind vulnerabilities", "upgrade Log4j"
- **General request** — "fix the top issues", "show me what to fix" → Phase 1 will select a batch

If issue data has already been retrieved in this conversation, skip to Phase 1. Otherwise, use the platform skill to retrieve it before continuing.

### Phase 0 → Phase 1 gate

Before advancing, confirm all three items are resolved:

- [ ] Platform identified (FoD or SSC)
- [ ] Release / application version identified
- [ ] Fix target classified (specific IDs / filter / component / general)

Do NOT proceed to Phase 1 until all three are confirmed.

### FoD ↔ SSC Field Mapping

FoD and SSC use different field names for the same concepts. Use this mapping whenever constructing queries or interpreting results:

| Concept | FoD field | SSC field |
|---------|-----------|----------|
| Issue instance ID | `instanceId` | `issueInstanceId` |
| Category name | `category` | `issueName` |
| Severity | `severityString` | `friority` |
| Scan type | `scanType` (`Static`, `Dynamic`, `OpenSource`) | `analyzer` (`SCA`, `Open Source`, etc.) |
| Auditor/analysis status | `auditorStatus` | Custom tag (typically `Analysis`) |
| Suppressed | `isSuppressed` | `suppressed` |

---

## Phase 1: Identify the Target Issue Set

> Load `references/issue-targeting.md` before working through this phase.

Phase 1 ends when you have a **confirmed, specific list of Fortify issue IDs with enough summary data to begin planning**.

**Specific request** (issue IDs or precise filter already given): Verify you have the issue details; proceed immediately.

**Category/file/component request**: Use the platform skill's issue investigation commands to filter to the matching issues. Present the full matching list to the user so they can confirm the scope before you proceed.

**General request** ("fix the top issues", no specific target): Identify a proposed batch of related issues representing the best remediation value, then present this proposal to the user for confirmation. See `references/issue-targeting.md` for how to select and group issues effectively.

Keep the target set to related issues that can be addressed in a single pass. Mixing unrelated issue types or too many categories in one batch leads to unfocused, harder-to-review changes. See `references/issue-targeting.md` for how to group by type and category.

**Audit status and false positive awareness**: The `fcli fod/ssc issue list` commands exclude suppressed/hidden issues by default, so known false positives marked as suppressed are already filtered out. However, unaudited issues (FoD: `auditorStatus == 'Pending Review'`; SSC: no `Analysis` custom tag set) may include false positives. When selecting issues for a general request, prefer issues that have been audited and confirmed as true positives. For unaudited issues, factor the false-positive risk into your planning — flag uncertain issues to the user rather than planning fixes that may be unnecessary.

### Phase 1 → Phase 2 gate

Before advancing, verify:

- [ ] You have a specific, enumerated list of issue IDs (not just a filter expression)
- [ ] Each issue has enough summary data (category, severity, file/location) to begin planning
- [ ] The user has confirmed the scope
- [ ] For general requests: the user has approved your proposed batch
- [ ] Any issues flagged as uncertain false positives have been called out to the user

Do NOT proceed to Phase 2 until the user has confirmed the target issue set.

---

## Phase 2: Plan the Fix

Load the reference file for your scan type and follow it to completion. Each file owns the full planning workflow — all retrieval, analysis, and fix formulation steps — as well as the Phase 2 completion gate.

- **SAST or DAST**: load `references/sast-dast-fix-planning.md`
- **SCA / open source dependencies**: load `references/sca-fix-planning.md`

Return here for Phase 3 when the reference file signals that planning is complete.

---

## Phase 3: Present and Confirm the Plan

Always present the full remediation plan to the user before making any changes. Include:

1. **Target issue list** — IDs, categories, severities, file/URL locations
2. **Proposed changes** — for each: what file or config changes, what specifically changes, and the security rationale (e.g., "parameterize query to prevent injection" rather than "Fortify said to fix this")
3. **Version upgrade strategy** (SCA only) — present both the minimum safe version and the latest non-breaking version options; include the user's choice as part of plan confirmation
4. **Risk notes** — anything that may change behavior, break API contracts, require config updates, or affect downstream callers
5. **Unit tests** — any new or updated tests you propose to add
6. **Out of scope** — explicitly name any issues in the target set you're deferring and why (e.g., insufficient context, requires architectural change, appears to be a false positive needing review)

If you're uncertain about a fix, say so explicitly rather than guessing. It is better to flag ambiguity than to implement an incorrect fix.

**Wait for explicit user confirmation before proceeding to implementation.** Do NOT begin Phase 4 until the user has reviewed and approved the plan.

---

## Phase 4: Implement and Verify

Load the reference file for your scan type and follow it to completion. Each file owns the full implementation workflow and completion gate.

- **SAST or DAST**: load `references/sast-dast-implementation.md`
- **SCA / open source dependencies**: load `references/sca-implementation.md`

### Completion Summary

After the reference file signals Phase 4 complete, return here and provide:

- What was changed (files, change types, issue categories resolved)
- Any issues from the original target list that were **not** fixed, with a brief explanation
- A note for the user to re-run Fortify to confirm resolution (do not block on this)

---

## Reference Files

| File | When to load |
|------|--------------|
| `references/issue-targeting.md` | How to select and group issues; "bang for buck" heuristics; how to handle general vs specific requests; Fortify taxonomy guide; SAST vs DAST vs SCA mixing rules |
| `references/sast-dast-fix-planning.md` | SAST and DAST fix planning (Phase 2); retrieving Aviator AI guidance (FoD); reading and interpreting SAST traces; codebase analysis patterns; unit test guidance |
| `references/sca-fix-planning.md` | SCA/open source dependency fix planning (Phase 2); collecting CVEs; selecting the minimum safe upgrade version; breaking change analysis |
| `references/sast-dast-implementation.md` | SAST and DAST implementation (Phase 4); apply-build-test loop; code comment guidelines; completion gate |
| `references/sca-implementation.md` | SCA dependency implementation (Phase 4); package manager commands by ecosystem; transitive dependency handling; build and verification checklist |

---

## Cross-Skill Dependencies

This skill relies on the Fortify platform skills for issue data retrieval. Activate the appropriate skill by name before querying Fortify:

| Platform | Skill to activate |
|----------|-------------------|
| Fortify on Demand (FoD) | `fortify-fod` |
| Software Security Center (SSC) | `fortify-ssc` |

The platform skills handle authentication verification, issue querying, and auditing workflows. Do not duplicate their commands here — compose this workflow on top of them.
