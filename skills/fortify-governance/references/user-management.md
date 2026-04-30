## Use Case: User and Group Management

This reference covers creating, updating, and deactivating users and groups on FoD and SSC, and managing role assignments.

> Before any write operation, confirm the platform and verify you have an active session with sufficient administrative privileges. Read-only commands are always safe to run first.

---

### Listing Users and Roles

**FoD — list users:**
```bash
fcli fod access-control user list -o json
fcli fod access-control user list --query "username matches '(?i).*smith.*'" -o json
```

**FoD — list roles:**
```bash
fcli fod access-control role list -o json
```

**FoD — list groups:**
```bash
fcli fod access-control group list -o json
```

**SSC — list users:**
```bash
fcli ssc access-control user list -o json
fcli ssc access-control user list --query "username matches '(?i).*smith.*'" -o json
```

**SSC — list roles:**
```bash
fcli ssc access-control role list -o json
```

---

### Creating Users

Show the user what will be created before executing.

**FoD:**
```bash
fcli fod access-control user create \
  --username <username> \
  --email <email> \
  --firstname <firstname> \
  --lastname <lastname> \
  --role <roleName>
```

**SSC:**
```bash
fcli ssc access-control user create \
  --username <username> \
  --password <password> \
  --email <email> \
  --firstname <firstname> \
  --lastname <lastname> \
  --roles <roleName>
```

For SSC, if LDAP is configured users are typically provisioned on first login — creating them manually is only needed for local accounts.

---

### Updating Users and Role Assignments

Before updating, show the current state:
```bash
fcli fod access-control user get <username> -o json
fcli ssc access-control user get <username> -o json
```

**FoD — update role:**
```bash
fcli fod access-control user update <username> --role <newRoleName>
```

**SSC — update roles:**
```bash
fcli ssc access-control user update <username> --roles <roleName1>,<roleName2>
```

Changing roles takes effect on the user's next request — no session invalidation is required.

---

### Deactivating and Deleting Users

Prefer deactivation over deletion when possible — it preserves audit history.

**FoD — deactivate:**
```bash
fcli fod access-control user update <username> --suspended true
```

**SSC — deactivate:**
```bash
fcli ssc access-control user update <username> --suspended true
```

**Deletion is irreversible.** Before deleting, show the user what will be removed and require two confirmations. See the safety rules in SKILL.md.

---

### Managing Groups (FoD)

FoD groups are used to assign permissions to multiple users at once.

**List groups and members:**
```bash
fcli fod access-control group list -o json
fcli fod access-control group get <groupName> -o json
```

**Create a group:**
```bash
fcli fod access-control group create --name <groupName>
```

**Add a user to a group:**
```bash
fcli fod access-control group-member create --group <groupName> --user <username>
```

Any group membership change affecting 3 or more users counts as a bulk operation — list affected users before proceeding and require explicit confirmation.

---

### Application-Level Access (FoD)

In FoD, applications can have their own user assignments in addition to tenant-wide roles. Use application user management for teams that only need access to specific applications.

**List users assigned to an application:**
```bash
fcli fod access-control app-user list --app <appNameOrId> -o json
```

**Assign a user to an application:**
```bash
fcli fod access-control app-user create --app <appNameOrId> --user <username> --role <roleName>
```

---

### Application Version Access (SSC)

SSC controls access at the application version level via team assignments.

**List teams for a version:**
```bash
fcli ssc appversion-team list --av "<AppName>:<VersionName>" -o json
```

**Add a team to a version:**
```bash
fcli ssc appversion-team add --av "<AppName>:<VersionName>" --team <teamName>
```
