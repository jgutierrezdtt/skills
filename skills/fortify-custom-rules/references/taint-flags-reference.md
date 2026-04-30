## Use Case: Taint Flags Reference

Taint flags are attributes attached to tainted data as it flows through the program. They enable sinks to discriminate among different taint types — preventing both false positives (a flag the sink doesn't care about triggers it) and false negatives (a relevant flag is not checked). This reference is used when authoring DataflowSinkRule, DataflowPassthroughRule, DataflowCleanseRule, or CharacterizationRule definitions.

---

### Three Categories of Taint Flags

| Category | Purpose | Behavior at sinks |
|----------|---------|-------------------|
| **General** | Default untrusted data (user input entering the app) | Checked automatically by most sinks unless overridden |
| **Neutral** | Informational metadata — indicates validation state or data properties | NOT treated as tainted in the strict sense; used to filter FPs |
| **Specific** | Custom source→sink pairing for data leaving the app (privacy, info leaks) | Only triggers sinks that explicitly declare the specific flag |

---

### General Taint Flags

These are the standard flags for user-controlled data entering the application. Sinks for injection vulnerabilities check one or more of these.

| Flag | Description |
|------|-------------|
| `WEB` | Data from any web request (HTTP parameters, headers, cookies, body) |
| `XSS` | Data that may be reflected in HTML output — subset of `WEB` |
| `FILE` | Data from file system reads |
| `DATABASE` | Data retrieved from a database query result |
| `ENVIRONMENT` | Data from environment variables or system properties |
| `NETWORK` | Data received from a network socket |
| `DESERIALIZED` | Data produced by deserialization |
| `PROCESS` | Data from external process output |
| `THREAD` | Data shared across threads |
| `REDIRECT` | Data used in redirect destinations |
| `SQL` | Data resulting from SQL query output |

---

### Neutral Taint Flags (Validation Signals)

Neutral flags mark that data has passed through a specific validation or sanitization step. They do NOT remove taint — they annotate it so sinks can choose to ignore already-validated paths.

| Flag | Description |
|------|-------------|
| `VALIDATED_SQL_INJECTION` | Data has been validated/escaped for SQL injection |
| `VALIDATED_XSS` | Data has been HTML-encoded or sanitized for XSS |
| `VALIDATED_PATH` | Data has been validated against an allowed path set |
| `VALIDATED_REDIRECT` | Data has been checked against an allowed redirect whitelist |
| `VALIDATED_DESERIALIZATION` | Data passed deserialization integrity checks |
| `ENCODED_HTML` | Data has been HTML-encoded |
| `ENCODED_URL` | Data has been URL-encoded |

When a cleanse rule adds a `VALIDATED_*` neutral flag, a sink can use `<Not><TaintFlagSet taintFlag="VALIDATED_SQL_INJECTION"/></Not>` to skip already-validated data.

---

### Specific Taint Flags

Specific flags are declared in the rulepack and create an isolated source→sink pairing. Taint carrying only a specific flag does NOT trigger sinks that check for general flags, and vice versa. This prevents cross-contamination between unrelated tracking concerns.

Common use cases:
- Privacy: tracking PII data from sources (e.g., `getUserSSN()`) to sinks that send data externally
- Information disclosure: tracking internal data to logging or response output

To declare a specific taint flag, add it to the taint flag set of the source rule and reference the same flag name in the sink.

---

### Using Taint Flags in Sink Conditionals

The `<Conditional>` element restricts when a DataflowSinkRule fires. Conditional logic uses:

**`<TaintFlagSet taintFlag="FLAG">`** — true if the taint path carries this flag.

**Check for specific flag (e.g., fire only on XSS-flagged data):**
```xml
<DataflowSinkRule formatVersion="4.0" language="java">
  <RuleID>CUSTOM-SINK-XSS-001</RuleID>
  <VulnCategory>Cross-Site Scripting</VulnCategory>
  <DefaultSeverity>4.0</DefaultSeverity>
  <FunctionIdentifier>
    <ClassName><![CDATA[com.example.ResponseWriter]]></ClassName>
    <FunctionName><![CDATA[writeHtml]]></FunctionName>
    <ApplyTo parameters="true" parameterIndex="0"/>
  </FunctionIdentifier>
  <Conditional>
    <TaintFlagSet taintFlag="XSS"/>
  </Conditional>
</DataflowSinkRule>
```

**Exclude already-validated data (reduce FPs):**
```xml
<Conditional>
  <Not>
    <TaintFlagSet taintFlag="VALIDATED_XSS"/>
  </Not>
</Conditional>
```

**Combine conditions (AND logic):**
```xml
<Conditional>
  <And>
    <TaintFlagSet taintFlag="WEB"/>
    <Not>
      <TaintFlagSet taintFlag="VALIDATED_SQL_INJECTION"/>
    </Not>
  </And>
</Conditional>
```

**Or logic:**
```xml
<Conditional>
  <Or>
    <TaintFlagSet taintFlag="WEB"/>
    <TaintFlagSet taintFlag="DATABASE"/>
  </Or>
</Conditional>
```

---

### Using Taint Flags in Passthrough and Cleanse Rules

**Passthrough — add a flag during propagation:**
```xml
<DataflowPassthroughRule formatVersion="4.0" language="java">
  <RuleID>CUSTOM-PT-001</RuleID>
  <FunctionIdentifier>
    <ClassName><![CDATA[com.example.InputDecoder]]></ClassName>
    <FunctionName><![CDATA[decode]]></FunctionName>
    <ApplyTo returnValue="true" parameters="false"/>
  </FunctionIdentifier>
  <!-- Output carries input taint plus XSS flag -->
  <TaintFlags><TaintFlag name="XSS"/></TaintFlags>
</DataflowPassthroughRule>
```

**Cleanse — remove a flag (partial cleanse):**
```xml
<DataflowCleanseRule formatVersion="4.0" language="java">
  <RuleID>CUSTOM-CLN-001</RuleID>
  <FunctionIdentifier>
    <ClassName><![CDATA[com.example.HtmlEncoder]]></ClassName>
    <FunctionName><![CDATA[encode]]></FunctionName>
    <ApplyTo returnValue="true"/>
  </FunctionIdentifier>
  <!-- Remove XSS flag but leave data tainted for other sinks -->
  <RemoveTaintFlags><TaintFlag name="XSS"/></RemoveTaintFlags>
</DataflowCleanseRule>
```

A cleanse with no `<TaintFlags>` specified removes all taint completely (full cleanse).

---

### Automatic Specific Flag Behavior

Any sink that does NOT explicitly declare a `<Conditional>` with a specific flag gets an automatic check added by Fortify: the taint flag set must NOT be specific-only (i.e., it must contain at least one general flag). This prevents specific-flagged data from unexpectedly triggering general sinks.

When authoring sinks that should only respond to specific flags, always declare the flag explicitly in `<Conditional>`.
