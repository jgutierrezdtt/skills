## Use Case: Rulepack Management

This reference covers importing, listing, and managing rulepacks in SSC via fcli. FoD rulepack management is handled by Fortify — see the SKILL.md platform scope note.

---

### List Installed Rulepacks

```bash
fcli ssc rulepack list -o json
```

Key fields in the output:
- `id` — internal rulepack ID used for deletion
- `name` — display name
- `version` — rulepack version string
- `rulePackType` — `FORTIFY` (Fortify-maintained) or `CUSTOM` (user-imported)
- `active` — whether the rulepack is currently active on the instance

---

### Import a Custom Rulepack

```bash
fcli ssc rulepack import --file <path/to/rulepack.zip>
```

Requirements:
- The file must be a valid `.zip` or `.bin` rulepack package.
- Requires SSC Administrator role.
- SSC will queue a background job to reprocess all application versions after import — this may take time on large instances.

Before importing in production:
1. Import and test in a staging SSC environment first.
2. Run a sample scan against a known test application to verify the new rules fire correctly.
3. Check that no existing findings are incorrectly reclassified.

Confirm with the user that the rulepack source is trusted and that staging validation has been completed before importing to production.

---

### Check Import Status

After importing, verify the rulepack appears in the list:
```bash
fcli ssc rulepack list --query "rulePackType=='CUSTOM'" -o json
```

Monitor the background processing queue by checking for versions with updated artifact status:
```bash
fcli ssc artifact list --av "<TestApp>:<TestVersion>" -o json
```

---

### Exporting / Backing Up Rulepacks

Fortify-managed rulepacks can be downloaded from the SSC UI (Administration > Rulepack). There is no direct `fcli ssc rulepack export` command — for backup of custom rulepacks, maintain the source `.zip` files in version control.

---

### Deactivating a Rulepack

There is no `fcli ssc rulepack deactivate` command in fcli 3.18. Rulepack activation state is managed via the SSC Administration UI (Administration > Rulepack > toggle active/inactive). Direct the user to the web UI for this operation.

---

### Deleting a Rulepack

```bash
# List first to confirm the target
fcli ssc rulepack list --query "name=='<RulepackName>'" -o json
# Delete — requires explicit confirmation from the user
fcli ssc rulepack delete --id <rulepakId>
```

Deleting a rulepack removes it from all future scans. It does not retroactively remove findings from existing scans. Confirm with the user before executing.

---

### Using Custom Rules in Local Fortify SCA Analysis

During development and testing, custom rules can be applied to a local Fortify SCA scan without importing to SSC:

```bash
sourceanalyzer -b <buildId> -rules <path/to/rules/> -scan -f results.fpr
```

This is the recommended workflow for rule validation before promoting to SSC.

---

### Custom Rulepack Distribution Workflow

1. Author rules in XML using the Fortify Rules Editor or a text editor.
2. Package into a `.zip` following the structure in `references/rulepack-structure.md`.
3. Test locally with `sourceanalyzer -rules`.
4. Import to staging SSC: `fcli ssc rulepack import`.
5. Validate findings on a known test application.
6. Import to production SSC after sign-off.
7. Archive the `.zip` in version control with a changelog entry.
