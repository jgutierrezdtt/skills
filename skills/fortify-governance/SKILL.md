---
name: fortify-governance
description: Administer and configure Fortify platforms (FoD and SSC). Use whenever the user asks about managing users, groups, roles, permissions, tokens, API keys, LDAP or SSO configuration, onboarding teams or projects to Fortify, managing application attributes or metadata, or any administrative task on the platform — even if the user does not say "admin" explicitly. Also triggers for: rotating or revoking tokens, configuring notification rules, managing custom tags or performance indicators at the platform level, or diagnosing platform health. Does NOT handle scanning, vulnerability triage, or CI/CD pipeline setup — use fortify-fod, fortify-ssc, or fortify-cicd-integration for those.
license: MIT
metadata:
  version: "1.0.0"
  tested-with:
    fcli: "3.18"
    fod: "26.1"
    ssc: "25.4"
---

Fortify platform governance covers everything outside of scanning and vulnerability management: who can access the platform, what they can do, how applications are structured, and how the platform is configured. Both FoD (SaaS) and SSC (self-hosted) are covered here, with differences noted where they diverge.

You interact with both platforms using `fcli`. It must already be on the PATH. If it is not installed, activate the `fcli-common` skill.

## Platform Disambiguation

If the request does not specify FoD or SSC, check active sessions:

```bash
fcli fod session ls --query "expired=='No'"
fcli ssc session ls --query "expired=='No'"
```

- Only FoD session active — proceed with FoD commands.
- Only SSC session active — proceed with SSC commands.
- Both active — ask the user which platform they want to administer.
- Neither active — ask which platform, then prompt to log in.

## Safety Rules for Administrative Operations

Administrative operations affect access control and platform configuration across all users and applications. Apply elevated caution:

- **Always list affected resources before modifying them.** Show the user what will change — names, roles, scope — before executing any write operation.
- **Require explicit confirmation for every mutating operation**, including single-user changes.
- **Access control changes require two confirmations.** After the user confirms once, ask a second time before executing. This applies to role assignments, group membership, token creation, and API key generation.
- **Never grant admin or tenant-wide roles** without presenting the exact proposed change and receiving two explicit confirmations.
- **Token and API key creation is irreversible in effect** — once a credential is issued it can be used until revoked. Treat creation with the same caution as a permission grant.

Read-only commands (`list`, `get`, `ls`) are always safe to run without confirmation.

## Reference Files

Load these only when needed for the specific task at hand:

| File | When to load |
|------|--------------|
| `references/user-management.md` | Creating, updating, deactivating, or deleting users; role assignments; group membership |
| `references/token-management.md` | Creating, listing, and revoking tokens and API keys (FoD and SSC) |
| `references/application-onboarding.md` | Onboarding new teams or projects; recommended application and version/release structure; attribute templates |
| `references/ssc-admin.md` | SSC-specific administration: LDAP/SSO, plugins, rulepacks, system configuration |

## Use Case Index

| Request | File to load |
|---------|-------------|
| Add or remove a user | `references/user-management.md` |
| Change a user's role or permissions | `references/user-management.md` |
| Create or manage a group | `references/user-management.md` |
| Create, list, or revoke a token or API key | `references/token-management.md` |
| Onboard a new team or application to Fortify | `references/application-onboarding.md` |
| Configure LDAP or SSO on SSC | `references/ssc-admin.md` |
| Import or manage rulepacks on SSC | `references/ssc-admin.md` |
| Configure SSC plugins or system settings | `references/ssc-admin.md` |

## Never Bypass fcli for Platform API Access

All administrative operations must go through fcli. Never read session files, extract tokens from disk, or call FoD or SSC APIs directly with curl or any HTTP client. The supported escape hatch for operations not covered by named commands is `fcli fod rest call` or `fcli ssc rest call`.
