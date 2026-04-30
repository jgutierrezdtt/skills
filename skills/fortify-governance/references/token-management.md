## Use Case: Token and API Key Management

This reference covers creating, listing, and revoking authentication tokens and API keys on FoD and SSC.

> Token and API key creation is effectively irreversible in impact — once issued, a credential can be used until explicitly revoked. Apply the same confirmation discipline as access control changes (two confirmations before creating or revoking).

---

### FoD: API Keys

FoD uses API keys (client ID + client secret) for service-account and CI/CD authentication, and Personal Access Tokens (PATs) for user-level access.

**List API keys:**
```bash
fcli fod access-control api-key list -o json
```

**Create an API key** (client credentials — for CI/CD and automation):
```bash
fcli fod access-control api-key create \
  --name <descriptiveName> \
  --role <roleName> \
  --description "<purpose and owner>"
```

Present the generated client ID and secret to the user once — it will not be shown again. Instruct them to store it immediately in their secret manager.

**Revoke an API key:**
```bash
# List first to confirm the target
fcli fod access-control api-key list --query "name=='<keyName>'" -o json
# Then revoke — requires two confirmations per safety rules in SKILL.md
fcli fod access-control api-key delete <keyId>
```

**FoD PATs (Personal Access Tokens)** are managed by individual users in the FoD portal — they cannot be created or revoked via fcli on behalf of another user.

---

### SSC: Tokens

SSC uses several token types for different purposes:

| Token type | Purpose |
|---|---|
| `UnifiedLoginToken` | General-purpose; used for fcli session login in automation |
| `CIToken` | Designed for CI/CD pipelines; no expiry unless set |
| `AutomationToken` | Alias for CIToken in some SSC versions |
| `AnalysisUploadToken` | Artifact upload only — least-privilege option for upload pipelines |

**List tokens for the current user:**
```bash
fcli ssc token list -o json
```

**Create a token:**
```bash
fcli ssc token create --type <tokenType> --description "<purpose and owner>"
```

Set `--expiration` to limit token lifetime in automated contexts:
```bash
fcli ssc token create --type CIToken --expiration "2026-12-31" --description "CI/CD pipeline - team X"
```

Present the generated token value to the user once — it will not be shown again.

**Revoke a token:**
```bash
# List first to confirm the target
fcli ssc token list --query "description matches '(?i).*<keyword>.*'" -o json
# Revoke — requires two confirmations per safety rules in SKILL.md
fcli ssc token delete <tokenId>
```

**Revoke all tokens for a user** (e.g., offboarding — use with elevated caution):
```bash
# List all tokens to show scope before proceeding
fcli ssc token list -o json
```

---

### Token Hygiene Recommendations

When the user asks about token rotation or security posture, surface these practices:

- Set explicit expiration dates on all tokens used in CI/CD pipelines.
- Use `AnalysisUploadToken` for upload-only pipelines — it limits blast radius if compromised.
- Revoke tokens for offboarded users or decommissioned pipelines immediately.
- Use distinct tokens per pipeline or team so revocation is targeted rather than broad.
- Never share tokens between teams — always issue separate credentials per consumer.
