## Use Case: Custom Action Signing

Custom fcli actions can be signed to verify their integrity and origin before execution. This is required in environments where `signatureValidation` is enforced in fcli configuration. This reference covers signing, verifying, and distributing signed fcli custom actions.

For the action YAML schema and authoring guidance, load `skills/fcli-common/references/action-yaml-reference.md` and `skills/fcli-common/references/fcli-custom-actions.md`.

---

### Why Sign Actions

Signing a custom action provides:
- **Integrity assurance** — the action has not been tampered with after signing.
- **Origin verification** — the action was produced by a trusted key holder.
- **Enforcement compatibility** — environments with `signatureValidation: SIGNATURE_OR_TRUSTED` will refuse to run unsigned actions.

---

### Key Generation

Signing uses a public/private RSA key pair. Generate one if not already available:

```bash
fcli tool action-helper generate-key-pair \
  --private-key-out private.key \
  --public-key-out public.key
```

Store the private key securely — in a secrets manager or an HSM, not in source control. The public key is distributed to consumers.

---

### Signing an Action

```bash
fcli tool action-helper sign \
  --action-file <path/to/action.yaml> \
  --private-key <path/to/private.key> \
  --output <path/to/action-signed.yaml>
```

The signed output is a self-contained YAML file with an embedded signature block. Do not manually edit the signed file — any modification will invalidate the signature.

---

### Verifying a Signed Action

Before distributing or running a signed action, verify the signature:

```bash
fcli tool action-helper verify \
  --action-file <path/to/action-signed.yaml> \
  --public-key <path/to/public.key>
```

A valid signature produces an exit code 0. An invalid or missing signature exits with a non-zero code.

---

### Configuring Signature Validation in fcli

fcli's signature enforcement behavior is controlled by the `signatureValidation` configuration key:

| Value | Behavior |
|-------|---------|
| `NONE` | No validation — unsigned and signed actions both run |
| `WARN` | Unsigned actions run but produce a warning |
| `SIGNATURE_OR_TRUSTED` | Only signed or trusted (Fortify-published) actions run |

**Check current configuration:**
```bash
fcli config list -o json
```

**Set validation level:**
```bash
fcli config set signatureValidation=SIGNATURE_OR_TRUSTED
```

In enterprise environments, recommend `SIGNATURE_OR_TRUSTED` to prevent execution of unverified automation.

---

### Distributing Signed Actions to a Team

The recommended distribution pattern:

1. Store signed action YAML files in a dedicated version-controlled repository (separate from application code).
2. Reference actions by URL in CI/CD pipelines:
   ```bash
   fcli action run --from-url https://raw.githubusercontent.com/org/fortify-actions/main/actions/my-action-signed.yaml [params]
   ```
3. Publish the corresponding public key in the same repository so consumers can verify independently.
4. For internal distribution without public GitHub, use an internal artifact repository (Nexus, Artifactory) and reference via URL.

---

### Key Rotation

When rotating signing keys:
1. Generate a new key pair.
2. Re-sign all active action files with the new private key.
3. Distribute the new public key to all consumers.
4. Remove or revoke the old public key from consumer configurations.
5. Verify that no pipelines still reference the old signed files (they will fail verification with the new key).

Confirm with the user the rotation scope before proceeding — key rotation affects all consumers simultaneously.

---

### Action Signing Checklist

Before distributing a signed action to a production team:

- [ ] Action YAML reviewed and tested in a staging environment
- [ ] Signed with the organization's designated signing key
- [ ] Signature verified with `fcli tool action-helper verify`
- [ ] Signed file stored in the approved distribution repository
- [ ] Public key available to all consumers for independent verification
- [ ] Consumer environments configured with `signatureValidation=SIGNATURE_OR_TRUSTED`
