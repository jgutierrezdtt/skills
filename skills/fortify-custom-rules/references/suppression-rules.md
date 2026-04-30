## Use Case: Suppression Rules and Alias Rules

Suppression rules and alias rules are **Manipulation Rules** — rulepack elements that modify analysis results rather than detecting vulnerabilities. They operate at the XML rulepack level and apply globally to every scan that loads the rulepack, unlike UI-level audit actions (which apply per issue per application version). Use suppression rules when:

- A pattern is a known architectural false positive (e.g., test fixtures, mock data, internal validation utilities)
- Third-party framework APIs trigger findings that are safe in your environment
- Certain file paths or packages are outside the threat model (test code, generated code)

**Important distinction**: These rules suppress findings before they are reported. They are not the same as marking an issue as FP in the SSC or FoD audit UI (which records a per-issue human decision). Suppression rules are appropriate for systematic, environment-wide exclusions that apply unconditionally.

---

### SuppressionRule XML Structure

```xml
<SuppressionRule formatVersion="4.0">
  <RuleID>CUSTOM-SUPPRESS-001</RuleID>

  <!-- Criteria define which findings to suppress. All specified criteria must match. -->
  <VulnCategory>SQL Injection</VulnCategory>

  <!-- Optional: restrict by file path pattern -->
  <SourceLocation>
    <Pattern>**/test/**</Pattern>
  </SourceLocation>

  <!-- Optional: restrict by function/method name -->
  <FunctionName>testSqlInjectionScenario</FunctionName>
</SuppressionRule>
```

---

### Common Suppression Patterns

**1. Suppress a category in test directories:**
```xml
<SuppressionRule formatVersion="4.0">
  <RuleID>CUSTOM-SUPPRESS-TEST-SQL-001</RuleID>
  <VulnCategory>SQL Injection</VulnCategory>
  <SourceLocation>
    <Pattern>**/test/**</Pattern>
    <Pattern>**/*Test.java</Pattern>
    <Pattern>**/*Tests.java</Pattern>
    <Pattern>**/*Spec.java</Pattern>
  </SourceLocation>
</SuppressionRule>
```

**2. Suppress a category in generated code:**
```xml
<SuppressionRule formatVersion="4.0">
  <RuleID>CUSTOM-SUPPRESS-GENERATED-001</RuleID>
  <VulnCategory>Privacy Violation</VulnCategory>
  <SourceLocation>
    <Pattern>**/generated/**</Pattern>
    <Pattern>**/target/generated-sources/**</Pattern>
  </SourceLocation>
</SuppressionRule>
```

**3. Suppress a specific function known to be safe:**
```xml
<SuppressionRule formatVersion="4.0">
  <RuleID>CUSTOM-SUPPRESS-SAFE-PATH-001</RuleID>
  <VulnCategory>Path Manipulation</VulnCategory>
  <FunctionName>validateAndResolvePath</FunctionName>
</SuppressionRule>
```

**4. Suppress a specific rule ID entirely:**
```xml
<SuppressionRule formatVersion="4.0">
  <RuleID>CUSTOM-SUPPRESS-RULEID-001</RuleID>
  <MatchedRule>
    <RuleID>BUILTIN-RULE-ID-TO-SUPPRESS</RuleID>
  </MatchedRule>
</SuppressionRule>
```

---

### AliasRule

AliasRule maps custom or framework-specific types to Fortify built-in types that already have associated taint behavior modeled. This extends taint coverage to custom wrapper classes without writing DataflowSourceRule entries for each method.

```xml
<AliasRule formatVersion="4.0" language="java">
  <RuleID>CUSTOM-ALIAS-HTTPREQUEST-001</RuleID>

  <!-- Custom type to alias -->
  <ClassName><![CDATA[com.example.framework.CustomRequest]]></ClassName>

  <!-- Fortify built-in type whose taint rules should apply to the custom type -->
  <AliasClassName><![CDATA[javax.servlet.http.HttpServletRequest]]></AliasClassName>
</AliasRule>
```

Once this alias is in place, any method called on `com.example.framework.CustomRequest` that matches an existing taint rule for `HttpServletRequest` (e.g., `getParameter()`, `getHeader()`) will be treated as a taint source automatically.

**When to use AliasRule vs CharacterizationRule:**

| Situation | Recommended approach |
|-----------|---------------------|
| Custom class wraps a known Fortify-modeled type | AliasRule |
| Custom annotation injects tainted values | CharacterizationRule |
| Custom class has different method signatures than the parent | DataflowSourceRule per method |

---

### ResultFilterRule

ResultFilterRule applies post-processing logic to suppress or modify findings based on combined criteria. It is evaluated after the analysis is complete.

```xml
<ResultFilterRule formatVersion="4.0">
  <RuleID>CUSTOM-FILTER-MOCK-DATA-001</RuleID>

  <!-- Suppress if finding involves a hardcoded constant value -->
  <VulnCategory>Password Management: Hardcoded Password</VulnCategory>
  <SourceLocation>
    <Pattern>**/config/test-*.properties</Pattern>
  </SourceLocation>
</ResultFilterRule>
```

---

### Authoring Guidelines for Suppression Rules

- Always restrict suppression rules as narrowly as possible. Suppressing a full category with no `<SourceLocation>` or `<FunctionName>` constraint suppresses all findings globally, which may hide real vulnerabilities.
- Include a comment or descriptive `<RuleID>` naming convention that explains WHY the finding is suppressed (e.g., `SUPPRESS-TESTCODE-SQL-001` is self-documenting; `SUPPRESS-001` is not).
- Suppression rules belong in a dedicated rulepack (e.g., `company-suppressions.xml`) separate from detection rules. This keeps suppression policy separately auditable and deployable.
- Review suppression rules during rulepack updates. If the suppressed pattern changes (e.g., the test framework is replaced), the suppression may become stale and hide real issues.
- Suppression rules are not a substitute for fixing false positives in the underlying detection rules. If a built-in rule consistently fires incorrectly, prefer tuning the detection rule or filing a support case with OpenText.
