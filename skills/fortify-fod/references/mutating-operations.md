# Safety Rules for Mutating Operations

> These rules apply before running ANY command that modifies, creates, or deletes data.  
> Read-only commands (`list`, `get`, `ls`, `count`) are always safe to run without confirmation.

---

## Delete — never run without explicit confirmation

`fcli <product> <module> delete` and `fcli <product> rest call -X DELETE` are **irreversible**.

Before any delete:
1. Run the equivalent `list` command with the same filters and show the user **exactly** what would be deleted: names, count, and any associated data at risk.
   - **FoD**: e.g., deleting an app also deletes all its releases, scans, and issues.
   - **SSC**: e.g., deleting an application version also deletes all its artifacts and issues.
2. State explicitly: "This will permanently delete [X]. Do you want to proceed?"
3. **Do not proceed until the user confirms.** Do not infer consent from the original request.
4. After the user confirms, ask once more: "Just to be sure — this action is irreversible. Please confirm you want to permanently delete [X]."
5. Only execute after receiving **two separate confirmations**.

If a non-destructive alternative exists, suggest it first:
- **FoD**: e.g., disable a user rather than deleting, or mark a release inactive.
- **SSC**: e.g., deactivate a version rather than deleting it.

---

## Create and Update — require confirmation before executing

For any `create` or `update` command:

**Single resource**: Summarize what will be created or changed (field name, new value), then wait for explicit user confirmation.

**Bulk operations** — any command that affects more than one resource (e.g., updating issues matching a broad filter, modifying multiple versions or releases, creating multiple users):
- List the affected resources first so the user can see the full scope.
- Require explicit confirmation before proceeding. Treat with the same caution as delete.

---

## Access Control — elevated caution

- **FoD**: `fcli fod access-control` — users, groups, roles, API keys. Changes affect the entire **tenant**.
- **SSC**: `fcli ssc access-control` — users, roles, tokens. Changes affect the entire **SSC instance**.

Access control operations can silently expand or revoke access across the entire platform.

- State clearly **who** will be affected and **what access** will change (granted or revoked).
- Require explicit user confirmation for every operation — including single-user changes.
- After the user confirms, ask a second time: "Access control changes can have broad security implications. Please confirm once more that you want to [grant/revoke] [role/permission] for [user/group]."
- Only execute after receiving **two separate confirmations**.
- **Never grant admin or platform-wide roles** (FoD: tenant-wide; SSC: instance-wide) without presenting the exact proposed change and receiving two clear confirmations.
- **FoD only**: Any group membership change affecting 3 or more users counts as a bulk operation — list affected users before proceeding.

---

## REST Passthrough

`fcli fod rest` / `fcli ssc rest`:

`-X POST` / `-X PUT` / `-X PATCH` → treat as create/update (confirmation required).  
`-X DELETE` → treat as delete (never execute without explicit user confirmation).
