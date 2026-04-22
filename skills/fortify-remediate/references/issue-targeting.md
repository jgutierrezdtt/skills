# Issue Targeting: Selecting and Grouping Issues for Remediation

This reference explains how to move from a Fortify issue list to a focused, remediation-ready target set.

---

## Handling Specific Requests

When the user names specific issues, categories, or files, your job is to confirm scope and collect details — not to re-select issues.

| Request type | What to do |
|---|---|
| "Fix issue 12345678" | Retrieve details for that specific ID; confirm it exists and is still active |
| "Fix all SQL Injection in UserService.java" | Filter issue list by `category` + `primaryLocation`; show the user the full list before proceeding |
| "Upgrade Log4j" | Identify all open issues linked to that component (name may vary — search broadly); treat as SCA batch |
| "Fix SSL and related config issues" | Filter on the category name; present the full list; use `matches` for partial category matching |

Always show the filtered results to the user before committing to the target set. Scope surprises are easier to handle before you've written code.

---

## Selecting Issues for General Requests

When the user says "fix the top issues" or similar without specifying a target, propose a batch of **3–5 related issues** for a single pass. Presenting a clear proposal is better than asking an open-ended question.

>Note: It's possible that there may be 10s, 100s, or in rare circumstances, 1000s of related issues that can be addressed through a single code change.

### "Bang for Buck" Selection Criteria

Score potential candidates on these factors and propose the batch with the highest combined value:

1. **Severity and exploitability** — Prioritize Critical and High findings. Issues Fortify classifies as likely-exploitable or that Aviator has reviewed and confirmed carry higher true-positive confidence.
2. **Audit confidence** — Issues that have been audited and confirmed as true positives (FoD: `auditorStatus` is not `Pending Review`; SSC: `Analysis` custom tag is set) are stronger candidates than unaudited issues. Unaudited issues may be false positives — they're still worth including, but factor the uncertainty into your proposal.
3. **Reach** — Issues in heavily-used, externally-facing code (web controllers, API endpoints, authentication paths) matter more than isolated utility code.
3. **Fix density** — Categories where one pattern fixes many instances (e.g., all `SQL Injection: JDBC` in one DAO class) are efficient picks. A single root cause fixing 10 issues is better than 10 unrelated one-off fixes.
4. **SCA overlap** — Upgrading a widely-used dependency (e.g., `spring-security`) can close many issues at once. These often look high-value even at lower severity.
5. **Low regression risk** — Prefer fixes that are self-contained and unlikely to change observable behavior. Defer complex architectural changes unless the user explicitly asks for them.

### How to Query for Candidates

Pull a prioritized view to reason about:

```bash
# FoD — critical/high issues grouped by category
# Note: FoD uses 'severityString' for severity and 'category' for grouping
fcli fod issue list --rel=<releaseNameOrId> \
  --query "severityString=='Critical' || severityString=='High'" \
  -o json

# SSC — unaudited critical/high issues
# Note: SSC uses 'friority' for severity and 'issueName' for grouping
fcli ssc issue list --av="<App:Version>" \
  --query "(friority=='Critical' || friority=='High') && audited==false" \
  -o json
```

Group the results by `category` (FoD) or `issueName` (SSC). Large clusters in the same category are strong candidates.

---

## Fortify Taxonomy for Grouping

Fortify categorizes issues using a **Kingdom → Category → Subcategory** hierarchy. For grouping purposes, focus on **Category** and **Category:Subcategory**.

Examples of the same logical vulnerability appearing as different subcategories:
- `SQL Injection` → `SQL Injection: MyBatis Mapper`, `SQL Injection: JDBC`, `SQL Injection: Hibernate`
- `Cross-Site Scripting` → `Cross-Site Scripting: Reflected`, `Cross-Site Scripting: Stored`, `Cross-Site Scripting: DOM`
- `Mass Assignment` → `Mass Assignment: Insecure Binder Configuration`

**Grouping rule**: Issues sharing the same top-level `Category` with no subcategory can usually be fixed in the same pass — they often share a root cause pattern. Issues with the same `Category:Subcategory` are almost always addressable with the same fix pattern in the same location.

When grouping, prefer focusing on one subcategory (or closely related subcategories in the same file) per remediation pass. Mixing `SQL Injection` and `Cross-Site Scripting` in the same pass is fine if they're in the same file and both have small, clear fixes; mixing them across 20 files in one pass is risky.

---

## SAST vs DAST vs SCA — Mixing Rules

Fortify issues come from three scan types, and mixing them in a single remediation pass requires care:

| Scan type | Primary data source | Typical fix |
|---|---|---|
| **Static (SAST)** | Source code analysis | Code change in application source |
| **Dynamic (DAST)** | Runtime/web scanning | Code change, configuration, headers, or middleware |
| **Open Source (SCA)** | Dependency manifest analysis | Dependency version update |

**Do not mix SCA with SAST/DAST in the same remediation pass** unless the issue category is the same (rare — e.g., a SAST finding and an SCA finding both pointing to the same class in the same file). SCA fixes are version bumps; SAST/DAST fixes are code changes. They follow completely different workflows and carry different risk profiles.

**SAST and DAST can be mixed** when the category is identical (e.g., both are `SQL Injection`). If the category and fix location overlap, a single change can close both.

---

## How Much Detail to Pull Before Planning

The right amount of issue data to pull depends on the size of the target set:

| Target set size | Strategy |
|---|---|
| **1–10 issues** | Pull full details for all of them upfront (description, recommendations, traces) |
| **11–30 issues** | Pull details for a representative sample of 3-5 issues; if a clear pattern emerges, use it. Pull more if needed. |
| **30+ issues** | Definitely sample first — pull 3-5; confirm the pattern; proceed incrementally under a plan has been established. Document the pattern and apply it rather than reviewing every instance individually. Never attempt to pull details for more than 20 individual issues.  If no broader pattern has been identified, break the fixes up into independent, subsequent passes. |

For large sets, the goal is to identify the **remediation pattern**, not to review every instance. Once you know the pattern (e.g., "all these SQL injection issues need the same parameterized-query refactor across DAO methods"), you can apply it systematically.
