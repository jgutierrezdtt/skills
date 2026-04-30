## Use Case: Characterization Rules and Structural Predicates

CharacterizationRule is a superset of the traditional dataflow rules (DataflowSourceRule, DataflowSinkRule, etc.). It combines **Structural Analyzer pattern matching** with **Dataflow taint operations** in a single rule, enabling taint tracking through arbitrary expressions — not only function calls. Use this type when:

- A framework injects tainted data via annotations (e.g., `@RequestParam`, `@PathVariable`)
- Taint originates from field access or variable assignment rather than a method call
- Complex structural conditions must gate whether a taint operation applies
- You need to match multiple program points and apply taint operations to each

---

### CharacterizationRule XML Structure

```xml
<CharacterizationRule formatVersion="4.0" language="java">
  <RuleID>UNIQUE_GUID_HERE</RuleID>

  <!-- Structural predicate: Identifies code constructs using structural query syntax.
       Returns a set of matched items (variables, expressions, functions, etc.). -->
  <StructuralMatch><![CDATA[
    /* Structural query using predicate language (similar to XPath for AST) */
    Variable v: v.annotations contains
      [Annotation: type.name == "org.springframework.web.bind.annotation.RequestParam"]
  ]]></StructuralMatch>

  <!-- Definition: Taint operations applied to items matched by StructuralMatch.
       Supports: TaintSource, TaintWrite, TaintEntrypoint, TaintSink,
                 TaintTransfer, TaintCleanse. -->
  <Definition><![CDATA[
    TaintSource(v, {+WEB +XSS})
  ]]></Definition>
</CharacterizationRule>
```

---

### StructuralMatch Query Language

The structural predicate uses a typed query language to navigate the AST. Common patterns:

**Match parameters with a specific annotation:**
```
Variable v: v.annotations contains
  [Annotation: type.name == "javax.validation.constraints.NotNull"]
```

**Match a function call by method name:**
```
FunctionCall f: f.functionName == "getParameter"
```

**Match field access on a specific type:**
```
FieldAccess fa: fa.className == "HttpServletRequest" && fa.fieldName == "queryString"
```

**Match variables of a specific type:**
```
Variable v: v.type.name == "com.example.UserInput"
```

**Iterate over method parameters:**
```
Function fn: fn.name == "processRequest"
foreach Parameter p in fn.parameters
```

---

### Taint Operations in Definitions

Once the structural match identifies one or more code elements, the `<Definition>` block applies taint operations.

**TaintSource — mark as untrusted input:**
```
TaintSource(expression, {+FLAG1 +FLAG2})
```
Example — all `@RequestParam` annotated parameters are tainted with WEB and XSS flags:
```xml
<Definition><![CDATA[
  TaintSource(v, {+WEB +XSS})
]]></Definition>
```

**TaintSink — mark as dangerous use point:**
```
TaintSink(expression, "Category Name", severity)
```

**TaintTransfer — propagate taint from input to output:**
```
TaintTransfer(input_expression, output_expression, {optional_added_flags})
```

**TaintCleanse — remove taint or specific flags:**
```
TaintCleanse(expression)                    /* full cleanse */
TaintCleanse(expression, {-FLAG1})          /* partial cleanse: remove FLAG1 */
```

**TaintEntrypoint — method called by framework with already-tainted context:**
```
TaintEntrypoint(fn, {+WEB})
```

---

### Common Characterization Rule Patterns

**Pattern 1: Spring @RequestBody annotated parameters**
```xml
<CharacterizationRule formatVersion="4.0" language="java">
  <RuleID>CHAR-SPRING-REQUEST-BODY-001</RuleID>
  <StructuralMatch><![CDATA[
    Variable v: v.annotations contains
      [Annotation: type.name == "org.springframework.web.bind.annotation.RequestBody"]
  ]]></StructuralMatch>
  <Definition><![CDATA[
    TaintSource(v, {+WEB})
  ]]></Definition>
</CharacterizationRule>
```

**Pattern 2: Custom annotation marking sensitive data**
```xml
<CharacterizationRule formatVersion="4.0" language="java">
  <RuleID>CHAR-SENSITIVE-FIELD-001</RuleID>
  <StructuralMatch><![CDATA[
    Variable v: v.annotations contains
      [Annotation: type.name == "com.example.SensitiveData"]
  ]]></StructuralMatch>
  <Definition><![CDATA[
    TaintSource(v, {+PRIVATE})
  ]]></Definition>
</CharacterizationRule>
```

**Pattern 3: Entrypoint for a custom framework callback**
```xml
<CharacterizationRule formatVersion="4.0" language="java">
  <RuleID>CHAR-FRAMEWORK-ENTRYPOINT-001</RuleID>
  <StructuralMatch><![CDATA[
    Function fn: fn.annotations contains
      [Annotation: type.name == "com.example.framework.EventHandler"]
  ]]></StructuralMatch>
  <Definition><![CDATA[
    foreach Parameter p in fn.parameters
      TaintSource(p, {+WEB})
  ]]></Definition>
</CharacterizationRule>
```

---

### Conditional Elements in Dataflow Sinks

The `<Conditional>` element further restricts when a DataflowSinkRule or CharacterizationRule TaintSink fires. It is evaluated after the function match is found. Available operators:

| Element | Description |
|---------|-------------|
| `<TaintFlagSet taintFlag="FLAG">` | True if taint path carries the named flag |
| `<Not>` | Negates the inner condition |
| `<And>` | All inner conditions must be true |
| `<Or>` | At least one inner condition must be true |
| `<ConstantEq argument="N" value="V">` | Argument N is the constant value V |
| `<ConstantGt argument="N" value="V">` | Argument N is greater than constant V |
| `<ConstantLt argument="N" value="V">` | Argument N is less than constant V |
| `<IsType argument="N">TEXT</IsType>` | Argument N has the named type |
| `<ArgMatchesName argument="N">PATTERN</ArgMatchesName>` | Argument N's name matches pattern |

**Example — sink fires only when data is WEB-tainted and not validated:**
```xml
<DataflowSinkRule formatVersion="4.0" language="java">
  <RuleID>CUSTOM-SINK-SQL-001</RuleID>
  <VulnCategory>SQL Injection</VulnCategory>
  <DefaultSeverity>5.0</DefaultSeverity>
  <FunctionIdentifier>
    <ClassName><![CDATA[java.sql.Statement]]></ClassName>
    <FunctionName><![CDATA[executeQuery]]></FunctionName>
    <ApplyTo parameters="true" parameterIndex="0"/>
  </FunctionIdentifier>
  <Conditional>
    <And>
      <TaintFlagSet taintFlag="WEB"/>
      <Not>
        <TaintFlagSet taintFlag="VALIDATED_SQL_INJECTION"/>
      </Not>
    </And>
  </Conditional>
</DataflowSinkRule>
```

**Example — conditional passthrough (only propagates taint if constant flag is not set):**
```xml
<DataflowPassthroughRule formatVersion="4.0" language="java">
  <RuleID>CUSTOM-PT-CONDITIONAL-001</RuleID>
  <FunctionIdentifier>
    <ClassName><![CDATA[com.example.Formatter]]></ClassName>
    <FunctionName><![CDATA[format]]></FunctionName>
    <ApplyTo returnValue="true" parameters="false"/>
  </FunctionIdentifier>
  <Conditional>
    <Not>
      <ConstantEq argument="1" value="safe"/>
    </Not>
  </Conditional>
</DataflowPassthroughRule>
```

---

### When to Use CharacterizationRule vs Traditional Dataflow Rules

| Scenario | Recommended rule type |
|----------|----------------------|
| Model a library function call (JDK, framework) | DataflowSourceRule / DataflowSinkRule |
| Track taint through annotation-injected parameters | CharacterizationRule |
| Mark framework entry points (servlet, REST handler) | DataflowEntryPointRule or CharacterizationRule with TaintEntrypoint |
| Identify taint from field access or assignment | CharacterizationRule |
| Add context-dependent conditionals to taint operations | CharacterizationRule |
| Simple method-level source with no structural conditions | DataflowSourceRule (simpler XML) |

CharacterizationRule is the most flexible type. When in doubt about whether a traditional rule can express the intent, prefer CharacterizationRule.
