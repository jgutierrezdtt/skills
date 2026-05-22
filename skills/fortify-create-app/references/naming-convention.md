## Determine App Naming Convention
Follow the steps below to determine the application name and initial release (FoD) / version (SSC) name that match existing conventions and local repository information.  User this during Step 1 of the Fortify Application Creation skill.

## Step 1: Gather information
### Step 1a: Inspect existing application naming conventions
Fetch a sample of existing applications and releases from the selected platform to identify common naming patterns. Use a limited sample (50) to keep queries fast.

```bash
fcli fod release list --fetch=50 -o json
fcli ssc appversion list --fetch=50 -o json
```

### Step 1b: Gather local repository information (preferred: git metadata)
If working inside the codebase, use git to extract authoritative org/repo and branch info.

```bash
# current branch
git rev-parse --abbrev-ref HEAD

# remote URL (origin)
git remote get-url origin

# default branch on remote (works with most remotes)
git remote show origin | sed -n 's/.*HEAD branch: //p'

# if you have GitHub CLI (gh)
gh repo view --json nameWithOwner,defaultBranchRef -q '.nameWithOwner + " " + .defaultBranchRef.name'

# GitLab CLI (glab)
glab repo view --json path_with_namespace,default_branch -q '.path_with_namespace + " " + .default_branch'
```

Notes and fallbacks:
- `git remote get-url origin` yields the remote host and repo; parse to extract `owner/repo` (e.g., strip `.git` and URL parts).
- `git rev-parse --abbrev-ref HEAD` gives the active branch name; default branch is obtained from remote show or provider CLI.
- If no git remote exists, fall back to filesystem and project files (next section).

### Step 1c: Inspect local project metadata
If git metadata is unavailable or incomplete, try these fallbacks:

- Root folder name
```bash
basename "$(pwd)"
```
- README title or first heading (common project name)
```bash
grep -Eo '^# .*' README.md | sed 's/^# //;q' || true
```
- Language-specific metadata from package manager file in root (package.json, pom.xml, .csproj, etc)

Step 1 → Step 2 gate
 Example FoD or SSC application list obtained
 Git repository and/or other meta discovered

---

## Step 2: Propose application name and release/version name
If the user has provided an explicit application name and release/version name, use it.

If not provided, use the information from Step 1 propose a Fortify application name and release/version name.

Interpretation heuristics:
- Look for naming prefixes, suffixes, separators, BU identifiers, or team tags in `applicationName` and `name` values.
- If many names contain a slash (`org/repo`), tenant convention is likely to be `org/repo`.
- If most names are a single token (no slash) and resemble repo names, `repo` only.
- If names include versions (v25.1, v26.1), identifiers or other patterns, plan accordingly.

If no convention is identified, the defaut suggestion should be:
- Application Name = Git "org/repo"
- Release or App Version Name = "current branch"

Step 2 → Step 3 gate
 Application name ready to propose
 Release/version name ready to propose

---

## Step 3: Confirm Names
Always present the suggested name and release/version to the user and ask for explicit confirmation before creating the application.

Example summary presented to user:

- Tenant convention: `org/repo` (detected: 38/50 entries contain `/`)
- Local repo: `acme/payments-api` (from `git remote get-url origin`)
- Current branch: `feature/new-checkout`
- Default branch: `main`
- Suggested Fortify application name: `acme/payments-api`
- Suggested release/version: `main`

Step 3 → Complete gate
 User confirms application and release/version names
