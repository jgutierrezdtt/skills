## Use Case: Content and Configuration Rules

ContentRule and ConfigurationRule are Fortify SAST rule types that analyze **non-source-code files** — XML, JSON, YAML, `.properties`, manifests, and deployment descriptors — for security misconfigurations, insecure defaults, and hardcoded secrets. They complement dataflow and structural rules, which only analyze source code.

Use these rule types when:
- A vulnerability exists in how the application is configured, not in how it is coded
- The file to analyze is a manifest (AndroidManifest.xml, web.xml, pom.xml, package.json)
- The misconfiguration is in an infrastructure file (Dockerfile, Kubernetes YAML, CloudFormation)
- Framework settings (Spring Boot, Django, .NET web.config) contain insecure defaults

---

### ContentRule vs ConfigurationRule

| Rule type | When to use |
|-----------|-------------|
| `ContentRule` | Analyze the **content** of a specific file by path pattern — XML, JSON, YAML, properties. Match via XPath, regex, JSONPath, or YAML path. |
| `ConfigurationRule` | Analyze **configuration settings** in framework config files. Higher-level than ContentRule; used for framework-specific configuration patterns. |

In practice, ContentRule is the more commonly used type. ConfigurationRule is appropriate when Fortify has built-in knowledge of the framework's configuration schema.

---

### ContentRule XML Structure

```xml
<ContentRule formatVersion="4.0">
  <RuleID>CUSTOM-CONTENT-001</RuleID>
  <VulnCategory>Configuration: Insecure Default</VulnCategory>
  <VulnKingdom>Environment</VulnKingdom>
  <DefaultSeverity>3.0</DefaultSeverity>

  <!-- File path pattern(s) this rule applies to -->
  <AppliesTo>
    <Pattern>AndroidManifest.xml</Pattern>
  </AppliesTo>

  <!-- The pattern that identifies a vulnerable configuration -->
  <ContentPattern type="xpath">
    //activity[@android:exported='true' and not(@android:permission)]
  </ContentPattern>

  <Description>
    Activity is exported without requiring a permission, allowing any application to launch it.
  </Description>

  <Recommendations>
    <Paragraph>
      Set android:exported="false" if the activity is not intended for use by other apps.
      If external access is needed, add android:permission to restrict callers.
    </Paragraph>
  </Recommendations>
</ContentRule>
```

---

### Pattern Types

**XPath — for XML files:**
```xml
<ContentPattern type="xpath">
  //activity[@android:exported='true' and not(@android:permission)]
</ContentPattern>
```

**Regex — for properties files, plain text, and inline string matching:**
```xml
<ContentPattern type="regex">
  (?i)password\s*=\s*[^\s${}]+
</ContentPattern>
```

**JSONPath — for JSON files:**
```xml
<ContentPattern type="jsonpath">
  $.dependencies[?(@.version =~ /.*\.0\.0$/)]
</ContentPattern>
```

**YAML Path — for YAML files:**
```xml
<ContentPattern type="yamlpath">
  spec.containers[*].securityContext.privileged
</ContentPattern>
```

---

### File Path Matching

The `<AppliesTo>` element restricts which files the rule scans. Use glob patterns:

```xml
<!-- Single specific file -->
<AppliesTo>
  <Pattern>AndroidManifest.xml</Pattern>
</AppliesTo>

<!-- All files matching a glob -->
<AppliesTo>
  <Pattern>**/*.properties</Pattern>
</AppliesTo>

<!-- Multiple file types -->
<AppliesTo>
  <Pattern>**/application.properties</Pattern>
  <Pattern>**/application.yml</Pattern>
  <Pattern>**/application-*.yml</Pattern>
</AppliesTo>

<!-- Kubernetes YAML files by convention -->
<AppliesTo>
  <Pattern>**/k8s/**/*.yaml</Pattern>
  <Pattern>**/kubernetes/**/*.yml</Pattern>
</AppliesTo>
```

---

### Common ContentRule Patterns by Technology

**Android — backup allowed:**
```xml
<ContentRule formatVersion="4.0">
  <RuleID>CUSTOM-ANDROID-BACKUP-001</RuleID>
  <VulnCategory>Privacy Violation: Backup Enabled</VulnCategory>
  <DefaultSeverity>2.5</DefaultSeverity>
  <AppliesTo><Pattern>AndroidManifest.xml</Pattern></AppliesTo>
  <ContentPattern type="xpath">
    //application[@android:allowBackup='true']
  </ContentPattern>
</ContentRule>
```

**Android — debuggable in production:**
```xml
<ContentRule formatVersion="4.0">
  <RuleID>CUSTOM-ANDROID-DEBUG-001</RuleID>
  <VulnCategory>Configuration: Debug Build</VulnCategory>
  <DefaultSeverity>4.0</DefaultSeverity>
  <AppliesTo><Pattern>AndroidManifest.xml</Pattern></AppliesTo>
  <ContentPattern type="xpath">
    //application[@android:debuggable='true']
  </ContentPattern>
</ContentRule>
```

**Maven — insecure HTTP repository:**
```xml
<ContentRule formatVersion="4.0">
  <RuleID>CUSTOM-MAVEN-HTTP-REPO-001</RuleID>
  <VulnCategory>Configuration: Insecure Transport</VulnCategory>
  <DefaultSeverity>3.0</DefaultSeverity>
  <AppliesTo><Pattern>pom.xml</Pattern></AppliesTo>
  <ContentPattern type="xpath">
    //repository/url[starts-with(text(), 'http://')]
  </ContentPattern>
</ContentRule>
```

**Docker — running as root:**
```xml
<ContentRule formatVersion="4.0">
  <RuleID>CUSTOM-DOCKER-ROOT-001</RuleID>
  <VulnCategory>Configuration: Privileged Container</VulnCategory>
  <DefaultSeverity>3.5</DefaultSeverity>
  <AppliesTo>
    <Pattern>Dockerfile</Pattern>
    <Pattern>**/Dockerfile</Pattern>
    <Pattern>**/Dockerfile.*</Pattern>
  </AppliesTo>
  <ContentPattern type="regex">
    (?i)^USER\s+root\s*$
  </ContentPattern>
</ContentRule>
```

**Kubernetes — privileged container:**
```xml
<ContentRule formatVersion="4.0">
  <RuleID>CUSTOM-K8S-PRIVILEGED-001</RuleID>
  <VulnCategory>Configuration: Privileged Container</VulnCategory>
  <DefaultSeverity>4.5</DefaultSeverity>
  <AppliesTo>
    <Pattern>**/*.yaml</Pattern>
    <Pattern>**/*.yml</Pattern>
  </AppliesTo>
  <ContentPattern type="yamlpath">
    spec.containers[*].securityContext[?(@.privileged == true)]
  </ContentPattern>
</ContentRule>
```

**.NET Web.config — custom errors disabled:**
```xml
<ContentRule formatVersion="4.0">
  <RuleID>CUSTOM-DOTNET-CUSTOMERRORS-001</RuleID>
  <VulnCategory>Configuration: Information Exposure</VulnCategory>
  <DefaultSeverity>2.5</DefaultSeverity>
  <AppliesTo>
    <Pattern>Web.config</Pattern>
    <Pattern>web.config</Pattern>
  </AppliesTo>
  <ContentPattern type="xpath">
    //customErrors[@mode='Off']
  </ContentPattern>
</ContentRule>
```

**Properties file — hardcoded password:**
```xml
<ContentRule formatVersion="4.0">
  <RuleID>CUSTOM-PROPS-PASSWORD-001</RuleID>
  <VulnCategory>Password Management: Hardcoded Password</VulnCategory>
  <DefaultSeverity>4.0</DefaultSeverity>
  <AppliesTo>
    <Pattern>**/*.properties</Pattern>
    <Pattern>**/*.env</Pattern>
  </AppliesTo>
  <ContentPattern type="regex">
    (?i)(password|passwd|pwd)\s*=\s*(?!\$\{)[^\s#]+
  </ContentPattern>
</ContentRule>
```

---

### ConfigurationRule Structure

ConfigurationRule is used when Fortify has built-in schema awareness of the framework configuration format. It targets specific setting keys rather than raw file content.

```xml
<ConfigurationRule formatVersion="4.0">
  <RuleID>CUSTOM-SPRING-ACTUATOR-001</RuleID>
  <VulnCategory>Configuration: Exposed Management Endpoint</VulnCategory>
  <DefaultSeverity>3.5</DefaultSeverity>

  <ConfigPattern>
    <FilePattern>**/application.properties</FilePattern>
    <ContentMatch>
      <!-- Actuator endpoints exposed without security -->
      <Pattern>management\.endpoints\.web\.exposure\.include\s*=\s*\*</Pattern>
    </ContentMatch>
  </ConfigPattern>

  <Description>
    Spring Boot Actuator exposes all management endpoints. Without security configuration,
    this can expose sensitive operational data and allow unauthorized operations.
  </Description>
</ConfigurationRule>
```

---

### Technology Coverage Reference

| Technology | File(s) to target | Common issues to detect |
|------------|-------------------|------------------------|
| Android | `AndroidManifest.xml` | Exported components, backup enabled, debuggable flag |
| iOS | `Info.plist` | ATS exceptions, URL scheme hijacking, insecure data storage keys |
| Spring Boot | `application.properties`, `application.yml` | Actuator exposed, security disabled, debug mode |
| .NET | `Web.config`, `appsettings.json` | Custom errors off, connection strings with passwords |
| Django | `settings.py` | `DEBUG = True`, `ALLOWED_HOSTS = ['*']`, weak `SECRET_KEY` |
| Maven | `pom.xml` | HTTP repositories, vulnerable dependency versions |
| npm | `package.json` | Outdated dependencies, scripts with sensitive commands |
| Docker | `Dockerfile` | Running as root, sensitive ENV variables |
| Kubernetes | `*.yaml` / `*.yml` | Privileged containers, hostPath mounts, no resource limits |
| AWS | `cloudformation.yml`, `*.tf` | Public S3 buckets, unrestricted security groups |
| CI/CD | `.github/workflows/*.yml`, `Jenkinsfile` | Secrets in env vars, debug logging of secrets |

---

### Authoring Guidelines

- Limit `<AppliesTo>` patterns to the minimum necessary scope. A wildcard `**/*.yaml` will match every YAML file in the project — Kubernetes-specific rules should scope to `**/k8s/**/*.yaml` or equivalent.
- Test the XPath/regex/JSONPath/YAMLPath pattern against a sample file before deploying the rule. Invalid patterns produce no findings rather than an error.
- Prefer XPath for XML files — it is more precise than regex and handles namespace prefixes correctly.
- Place content and configuration rules in a dedicated rulepack (e.g., `company-config-rules.xml`) separate from dataflow rules. This allows selective deployment when only configuration scanning is needed.
- Always include a `<Recommendations>` block with a concrete remediation instruction, not just a description of the problem.
