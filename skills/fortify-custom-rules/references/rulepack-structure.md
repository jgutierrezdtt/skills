## Use Case: Rulepack Structure

This reference covers the XML structure of a Fortify SAST custom rulepack and the available rule types. Use this when the user wants to author a new detection rule or understand how an existing rule is constructed.

For importing and managing rulepacks in SSC, load `references/rulepack-management.md`.

---

### Rulepack File Format

A Fortify custom rulepack is a `.zip` file containing one or more rule XML files. The recommended structure is:

```
my-custom-rulepack.zip
  rules/
    my-rules.xml
    my-rules-datatypes.xml   (optional: custom data type definitions)
  rulepack.properties        (optional: metadata)
```

The `.zip` is what you import into SSC. During development, the XML files can be loaded directly into Fortify SCA via the `-rules` flag during local analysis.

---

### Rulepack XML Header

Every rule XML file must include the Fortify namespace declaration:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<RulePack xmlns="xmlns://www.fortify.com/schema/rules"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="xmlns://www.fortify.com/schema/rules rules.xsd"
          version="4.0"
          language="">
  <RulePackID>com.example.myrulepack</RulePackID>
  <Name><![CDATA[My Custom Rulepack]]></Name>
  <Version>1.0</Version>
  <Description><![CDATA[Custom rules for my organization]]></Description>
  <Rules>
    <!-- Rules go here -->
  </Rules>
</RulePack>
```

Set `language` to the target language (e.g., `java`, `python`, `csharp`) or leave empty for language-agnostic rules.

---

### Rule Types

| Rule Type | Purpose |
|-----------|---------|
| `DataflowSourceRule` | Mark a function/method as a source of tainted data |
| `DataflowSinkRule` | Mark a function/method as a dangerous sink (injection point) |
| `DataflowPassthroughRule` | Propagate taint through a custom function |
| `DataflowCleanseRule` | Mark a function as a sanitizer that removes taint |
| `SemanticRule` | Detect a code pattern without tracking data flow (structural match) |
| `ControlflowRule` | Detect patterns based on control flow (e.g., missing check before call) |
| `ConfigurationRule` | Detect vulnerabilities in configuration files (XML, YAML, properties) |

---

### DataflowSourceRule Example

Marks a custom method as a source of user-controlled input:

```xml
<DataflowSourceRule formatVersion="4.0" language="java">
  <RuleID>CUSTOM-SRC-001</RuleID>
  <VulnKingdom>Input Validation and Representation</VulnKingdom>
  <VulnCategory>Custom Taint Source</VulnCategory>
  <VulnSubcategory>Untrusted Input from Custom API</VulnSubcategory>
  <DefaultSeverity>2.0</DefaultSeverity>
  <Description><![CDATA[Data from this source is user-controlled.]]></Description>
  <FunctionIdentifier>
    <NamespaceName><![CDATA[com.example.api]]></NamespaceName>
    <ClassName><![CDATA[RequestHelper]]></ClassName>
    <FunctionName><![CDATA[getUserInput]]></FunctionName>
    <ApplyTo returnValue="true" parameters="false"/>
  </FunctionIdentifier>
</DataflowSourceRule>
```

---

### DataflowSinkRule Example

Marks a custom method as a dangerous sink:

```xml
<DataflowSinkRule formatVersion="4.0" language="java">
  <RuleID>CUSTOM-SINK-001</RuleID>
  <VulnKingdom>Input Validation and Representation</VulnKingdom>
  <VulnCategory>SQL Injection</VulnCategory>
  <VulnSubcategory>Custom Query Executor</VulnSubcategory>
  <DefaultSeverity>5.0</DefaultSeverity>
  <Description><![CDATA[Tainted data reaching this method may cause SQL injection.]]></Description>
  <FunctionIdentifier>
    <NamespaceName><![CDATA[com.example.db]]></NamespaceName>
    <ClassName><![CDATA[QueryRunner]]></ClassName>
    <FunctionName><![CDATA[executeRaw]]></FunctionName>
    <ApplyTo returnValue="false" parameters="true" parameterIndex="0"/>
  </FunctionIdentifier>
</DataflowSinkRule>
```

---

### SemanticRule Example

Detects a method call without a specific preceding check (structural pattern):

```xml
<SemanticRule formatVersion="4.0" language="java">
  <RuleID>CUSTOM-SEM-001</RuleID>
  <VulnKingdom>Security Features</VulnKingdom>
  <VulnCategory>Missing Authorization Check</VulnCategory>
  <DefaultSeverity>3.0</DefaultSeverity>
  <Description><![CDATA[Sensitive operation called without prior authorization check.]]></Description>
  <Pattern>
    <![CDATA[
      FunctionCall fc: fc.name == "executeAdminAction" &&
      not exists FunctionCall auth: auth.name == "checkAdminRole" && auth.precedes(fc)
    ]]>
  </Pattern>
</SemanticRule>
```

---

### Authoring Guidelines

- Assign unique, stable `RuleID` values — use a company prefix (e.g., `ACME-SRC-001`) to avoid collisions with Fortify's built-in rules.
- Set `DefaultSeverity` on a 0–5 scale: 5 = Critical, 4 = High, 3 = Medium, 2 = Low, 1 = Info.
- Use `VulnKingdom` and `VulnCategory` values consistent with Fortify's taxonomy to ensure proper grouping in reports.
- Test rules locally using Fortify SCA with the `-rules` flag before packaging for import.
- Do not include sensitive data (credentials, internal host names) in rule descriptions or patterns.
