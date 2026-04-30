## Use Case: SSC Platform Administration

This reference covers SSC-specific administrative tasks: LDAP/SSO configuration, rulepack management, plugins, and system configuration. These operations require SSC Administrator role.

> All operations here are platform-wide in effect. Apply the safety rules from SKILL.md: list before modifying, require explicit confirmation, and require two confirmations for access control and credential changes.

---

### LDAP Configuration

SSC supports LDAP and Active Directory for user authentication. LDAP configuration is done in the SSC web administration UI — there are no fcli commands that directly modify LDAP server settings. Direct the user to:

**SSC Administration UI path:** Administration > Configuration > LDAP

When LDAP is configured:
- Users authenticate with their LDAP credentials on first login.
- SSC creates a local user record on first successful login.
- Role assignments are still managed in SSC — LDAP does not sync roles automatically unless LDAP group mapping is configured.
- Local SSC passwords become irrelevant for LDAP-authenticated users.

To check whether an existing user was created via LDAP (distinguished by `ldap` as their external ID source):
```bash
fcli ssc access-control user get <username> -o json
```

---

### Rulepack Management

Rulepacks define the vulnerability detection rules applied during SAST analysis. SSC ships with Fortify-maintained rulepacks; custom rulepacks can also be imported.

**List installed rulepacks:**
```bash
fcli ssc rulepack list -o json
```

**Import a rulepack** (`.bin` or `.zip` file — requires SSC Administrator):
```bash
fcli ssc rulepack import --file <rulepacks.zip>
```

After importing, SSC queues a rulepack update for all application versions. Processing may take time on large instances.

**Check rulepack update status across versions:**
```bash
fcli ssc appversion list --query "currentState.rulepacks!=null" -o json
```

**Activate or deactivate a rulepack for a specific application version:**

Rulepack activation per version is controlled via the SSC UI (Application > Version > Profile > Rules) — there is no direct fcli command for per-version rulepack filtering. For platform-wide rulepack management, use `fcli ssc rulepack` commands. For questions about per-version rule customization, direct the user to the SSC web UI.

---

### Plugin Management

SSC plugins extend the platform (bug tracker integrations, authentication providers, parser plugins for third-party scan results). Plugin management requires SSC Administrator.

**List installed plugins:**
```bash
fcli ssc plugin list -o json
```

**Install a plugin** (`.jar` file):
```bash
fcli ssc plugin install --file <plugin.jar>
```

**Enable or disable a plugin:**
```bash
fcli ssc plugin enable --id <pluginId>
fcli ssc plugin disable --id <pluginId>
```

**Uninstall a plugin:**
```bash
# List first to confirm target
fcli ssc plugin list --query "name=='<pluginName>'" -o json
# Uninstall — requires explicit confirmation
fcli ssc plugin uninstall --id <pluginId>
```

Before installing any plugin, confirm with the user:
- Source of the plugin (official Fortify plugin or third-party)
- Whether the plugin requires a restart of the SSC application server

---

### System Configuration — Checking Instance Health

**Check SSC version and configuration summary:**
```bash
fcli ssc system info -o json
```

**List active sessions (to check concurrent usage):**
```bash
fcli ssc access-control user list --query "lastLoginDate!=null" -o json
```

**Check for versions with processing errors or attention required:**
```bash
fcli ssc appversion list --query "currentState.attentionRequired==true" -o json
```

**Check artifact processing queue (recent uploads and their status):**
```bash
fcli ssc artifact list --av "<AppName>:<VersionName>" -o json
```

For deeper diagnostics (JVM health, database connection pool, memory) — direct the user to the SSC server logs and the SSC Administration UI. These are not accessible via fcli.

---

### Custom Tags (Platform Level)

Custom tags are tenant-wide definitions that can be applied to issues for audit tracking. They are defined at the SSC level and then assigned to application versions.

**List all custom tag definitions:**
```bash
fcli ssc custom-tag list -o json
```

**List custom tags assigned to a specific version:**
```bash
fcli ssc custom-tag list --av "<AppName>:<VersionName>" -o json
```

Custom tag creation and modification is done via the SSC REST API. Use `fcli ssc rest call` if fcli does not expose a named command for the required operation — check `fcli ssc custom-tag -h` for available subcommands first.
