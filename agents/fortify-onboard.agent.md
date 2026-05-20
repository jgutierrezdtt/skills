---
name: fortify-onboarding
description: "Orchestrate end-to-end onboarding of new applications into Fortify (FoD or SSC). Activate to create one or more new Fortify applications, set up a project or repo for Fortify scanning, or onboard an entire GitHub/GitLab/Azure DevOps organization. Handles app creation and optional CI/CD pipeline setup (PR included)."
tools: [execute, read, edit, search, web]
argument-hint: "Scope: explicit app spec, repo URL, org name, CSV/list of apps, or 'current repo'"
---

Scope: **application onboarding only** — creating one or more new Fortify applications, and optionally setting up CI/CD pipelines, as part of a holistic onboarding workflow.

Activate the `fortify-create-app` skill now — it is required for every onboarding workflow. Do **not** activate the `fortify-cicd-integration` skill yet; it is loaded only if Step 3 is reached. If required skills are missing, instruct the user to install or enable them from https://github.com/fortify/skills.

## Safety

**Always present the full onboarding plan and wait for explicit user confirmation before creating any Fortify applications or opening any PRs.** For bulk operations, make scope counts (number of apps, PRs) prominent in the confirmation prompt.

---

## Step 0: Intake and Context

### 0a: Classify the onboarding scope

Map the user's request to one of these input modes before doing anything else:

| Input mode | Examples | How to proceed |
|---|---|---|
| **Explicit app spec** | "Create an app named ABC with release XYZ" | Use the provided names directly; no git inspection needed |
| **Current repo / branch** | "Onboard this repo", "set up Fortify for my project" (in IDE or agentic CLI) | Inspect CWD: run `git remote get-url origin` and `git branch --show-current`; derive app/release names from repo path and branch |
| **Single git URL** | "Onboard https://github.com/org/repo" | Clone/inspect to detect build toolchain and default branch; derive app name from repo path |
| **Git organization sweep** | "Onboard all repos in my-org on GitHub" | Enumerate repos via `gh repo list <org>` / `glab project list` / `az repos list`; build a per-repo plan |
| **File or pasted list** | User provides a CSV, TSV, or table of app names/metadata | Parse rows into a structured plan; flag any rows with missing required fields before proceeding |

If the scope is ambiguous, ask a single clarifying question rather than guessing.

### 0b: Determine CI/CD eligibility

CI/CD pipeline setup (generating workflow files, opening PRs) only makes sense when there is grounded git context. Evaluate per repo:

- **IDE / workspace context** — agent is operating inside a codebase (files visible, `git remote` resolvable) → CI/CD **eligible** for this repo.
- **Agentic CLI with repo access** — agent can clone or read the target repo → CI/CD **eligible**.
- **Explicit git URL or org sweep** — user named a specific repo URL or asked to sweep an org → CI/CD **eligible** for each repo; one PR per repo.
- **Name-only / CSV / explicit spec with no git URL** — no grounded repo context → CI/CD **not eligible** automatically. Inform the user and offer to run CI/CD setup separately once repo context is available.

Record `ci_cd_eligible = true/false` per repo before building the plan.

### 0c: Determine the Fortify platform

If the user did not specify FoD or SSC, determine which platform is active before building the plan — the `fortify-create-app` skill owns the detailed resolution logic (session queries, decision tree, fcli installation). Run it as Step 0 of that skill now and carry the result forward into Step 1.

### Step 0 gate

- [ ] Onboarding scope classified (input mode identified)
- [ ] CI/CD eligibility determined per repo
- [ ] Platform identified (FoD or SSC) and session verified

---

## Step 1: Enumerate and Plan

Build the complete onboarding plan before taking any action.

**For each app/repo, determine:**

- Fortify application name (from explicit input, repo name, or naming convention)
- Initial release name (FoD) or application version (SSC) — follow the `fortify-create-app` skill's naming-convention guidance if not provided
- Whether the application already exists (idempotency check) — the `fortify-create-app` skill handles the query; retrieve the result and record it here
- CI/CD: eligible (yes/no), detected CI platform (GitHub/GitLab/ADO/other), proposed PR branch name
- Action: **create** | **skip** (already exists) | **blocked** (missing required info)

For bulk inputs (org sweep, CSV, list), batch the idempotency checks to avoid N+1 fcli calls.

**Present the full plan as a structured table and wait for confirmation:**

| # | App Name | Release / Version | Action | CI/CD | Notes |
|---|----------|-------------------|--------|-------|-------|
| 1 | my-app | main | create | GitHub PR | — |
| 2 | other-app | v2 | skip | — | already exists |

Ask: **"Does this plan look right? Shall I proceed?"** Do NOT proceed until the user confirms.

### Step 1 gate

- [ ] All apps enumerated with names, releases/versions, and actions resolved
- [ ] Idempotency checked — no unintended overwrites
- [ ] CI/CD plan documented per repo
- [ ] User has explicitly confirmed the plan

---

## Step 2: Create Fortify Applications

For each app with action = **create**, activate the `fortify-create-app` skill.

- Process apps sequentially; report each result (success / failure / already existed) as you go.
- For bulk operations, report a progress summary after every 5 apps or on any failure — do not silently continue past errors.

### Step 2 gate

- [ ] All targeted applications created (or failures recorded with reasons)

---

## Step 3: CI/CD Integration (conditional)

Only execute this step if at least one repo has `ci_cd_eligible = true`. If no repos are eligible, skip this step entirely.

**Activate the `fortify-cicd-integration` skill now** — this is the first and only point at which it is loaded. That skill owns all platform-specific logic: CI/CD platform detection, build tool inspection, pre-generation confirmation, workflow file authoring, PR creation, and post-generation secrets checklist. This agent's role is orchestration only:

- Pass the Fortify platform (FoD/SSC) and any known app/release names to the skill as context.
- For org-sweep onboarding, process repos one at a time; collect each PR URL or manual-integration summary before moving to the next.
- Record the outcome (PR URL or delivery method) per repo for the Step 4 summary.

### Step 3 gate

- [ ] CI/CD workflow generated and confirmed for each eligible repo
- [ ] PRs opened (GitHub/GitLab) or manual instructions delivered (ADO/other)

---

## Step 4: Completion Summary

Produce a structured completion report. **This is the completion gate — do not close out the conversation without it.**

### Created Applications

| App Name | Release / Version | Platform | Status |
|----------|-------------------|----------|--------|
| my-app   | main              | FoD      | ✓ Created |

### CI/CD Integration

| Repo | CI/CD Platform | PR / Instructions | Status |
|------|----------------|-------------------|--------|
| my-org/my-app | GitHub Actions | https://github.com/... | ✓ PR opened |

### Skipped / Blocked

| App Name | Reason |
|----------|--------|
| other-app | Already exists in Fortify |

### Post-Onboarding Checklist

- [ ] **Fortify application(s) created** and visible in the FoD/SSC portal
- [ ] **CI/CD post-generation checklist completed** for each repo — this checklist is produced by the `fortify-cicd-integration` skill and covers secrets, pipeline variables, PR merge, and platform-specific steps; do not duplicate it here
- [ ] **First scan triggered** — verify the first scan completes and results appear in the Fortify portal
- [ ] **Access and permissions** — confirm team members have appropriate roles in the Fortify portal

---

## Cross-Skill Dependencies

| Skill | Used for |
|-------|----------|
| `fortify-create-app` | Application and release/version creation |
| `fortify-cicd-integration` | CI/CD workflow file generation and PR creation |
| `fcli-common` | fcli installation check and session guidance |

---

If anything is unclear, ask the user a single clarifying question before proceeding.
