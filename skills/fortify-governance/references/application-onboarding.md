## Use Case: Application Onboarding

This reference covers onboarding new teams or projects to Fortify — creating the application and version/release structure, configuring attributes, and setting access.

> Before creating anything, confirm the platform (FoD or SSC) and verify there is no existing application with the same or similar name. Duplicate applications are a common source of confusion and data fragmentation.

---

### Check for Existing Applications First

**FoD:**
```bash
fcli fod app list --query "name matches '(?i).*<keyword>.*'" -o json
```

**SSC:**
```bash
fcli ssc app list --query "name matches '(?i).*<keyword>.*'" -o json
```

If a match is found, present it to the user and confirm whether to use the existing application or create a new one. Do not create a duplicate.

---

### Recommended Application Structure

**One application per repository** is the standard pattern for most teams.

For **FoD**:
- One application per repo.
- One release per active branch or environment (e.g., `main`, `develop`, `v2.1`).
- Do not create a new application per sprint or per release — releases handle versioning within a single application.
- Microservices grouping within an application is optional and only useful when a single repo contains logically separate scan targets.

For **SSC**:
- One application per repo.
- One application version per active branch or environment (e.g., `main`, `staging`, `v25.1`).
- Seed new versions from an existing version to carry forward audit decisions and issue state.

---

### Creating an Application

**FoD:**
```bash
fcli fod app create \
  --name "<AppName>" \
  --type <applicationType> \
  --business-criticality <High|Medium|Low>
```

Confirm the name, type, and business criticality with the user before executing.

**SSC:**
```bash
fcli ssc app create --name "<AppName>"
```

SSC application creation is minimal — attributes and team assignments are configured at the version level.

---

### Creating a Release or Version

**FoD — create a release:**
```bash
fcli fod release create \
  --app "<AppName>" \
  --name "<ReleaseName>" \
  --sdlc-status <Development|QA|Production>
```

Seed from an existing release to carry forward scan configuration:
```bash
fcli fod release create \
  --app "<AppName>" \
  --name "<NewReleaseName>" \
  --copy-from "<AppName>:<SourceReleaseName>"
```

**SSC — create a version:**
```bash
fcli ssc appversion create \
  --app "<AppName>" \
  --version "<VersionName>"
```

Seed from an existing version to carry forward audit decisions:
```bash
fcli ssc appversion create \
  --app "<AppName>" \
  --version "<VersionName>" \
  --copy-from "<AppName>:<SourceVersionName>"
```

---

### Configuring Application Attributes (FoD)

FoD applications support custom attributes for metadata (team, business unit, compliance scope, etc.). List available attribute definitions first:

```bash
fcli fod attribute-definition list -o json
```

Set attributes on an application:
```bash
fcli fod app update "<AppName>" \
  --attrs "<AttributeName>=<Value>"
```

---

### Assigning Access After Creation

After creating an application or version, assign the appropriate users or teams. Load `references/user-management.md` for the relevant commands.

For FoD: use `fcli fod access-control app-user create` to assign users at the application level.
For SSC: use `fcli ssc appversion-team add` to assign teams at the version level.

---

### Onboarding Checklist

Before considering an application fully onboarded:

- [ ] Application created with correct name and type
- [ ] At least one release/version created for the primary branch
- [ ] Business criticality and SDLC status set
- [ ] Required attributes populated (team, business unit, compliance scope)
- [ ] Access assigned to the development and security teams
- [ ] CI/CD pipeline configured to scan the application — activate `fortify-cicd-integration` skill
