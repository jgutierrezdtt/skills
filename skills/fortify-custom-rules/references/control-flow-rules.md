## Use Case: Control Flow Rules

ControlFlowRule detects vulnerabilities that require **temporal and sequential analysis** — issues that only manifest when a sequence of operations occurs in a particular order, or when an operation is missing from a required sequence. The Fortify Control Flow Analyzer traverses the control flow graph (CFG) of the program and checks whether the execution paths satisfy the state machine defined in the rule.

Use this rule type when:
- A resource is allocated and must be released before the function exits (resource leaks)
- An operation must occur before or after another specific operation (call sequence validation)
- A security check must happen before a privileged operation (missing authentication check)
- Two operations must not both occur on the same resource (double-use patterns like TOCTOU)

This is distinct from DataflowRule, which tracks *data* values. ControlFlowRule tracks *resource states* and *call sequences*.

---

### ControlFlowRule XML Structure

```xml
<ControlFlowRule formatVersion="4.0" language="java">
  <RuleID>CUSTOM-CF-001</RuleID>
  <VulnCategory>Resource Leak: Unreleased Connection</VulnCategory>
  <VulnKingdom>API Abuse</VulnKingdom>
  <DefaultSeverity>3.0</DefaultSeverity>

  <StateMachine>
    <!-- States represent resource lifecycle points -->
    <State name="start" initial="true"/>
    <State name="acquired"/>
    <State name="released" accepting="false"/>  <!-- Safe terminal: resource was released -->
    <State name="leaked" accepting="true"/>     <!-- Error terminal: resource was not released -->

    <!-- Transitions are triggered by function calls or control flow events -->
    <Transition from="start" to="acquired">
      <FunctionCall className="java.sql.DriverManager" methodName="getConnection"/>
    </Transition>

    <Transition from="acquired" to="released">
      <FunctionCall methodName="close" instanceOf="java.sql.Connection"/>
    </Transition>

    <!-- If method returns without releasing: error -->
    <Transition from="acquired" to="leaked">
      <ReturnStatement/>
    </Transition>

    <!-- If exception is thrown without releasing: error -->
    <Transition from="acquired" to="leaked">
      <ThrowStatement/>
    </Transition>
  </StateMachine>
</ControlFlowRule>
```

---

### State Machine Concepts

| Element | Description |
|---------|-------------|
| `initial="true"` | Starting state — every code path begins here |
| `accepting="false"` | Safe terminal state — no vulnerability when path ends here |
| `accepting="true"` | Error terminal state — vulnerability detected when path ends here |
| `<Transition>` | Edge between states, triggered by a matching event |
| `<FunctionCall>` | Trigger: a specific method is called |
| `<ReturnStatement/>` | Trigger: function returns (any return) |
| `<ThrowStatement/>` | Trigger: exception is thrown |

---

### Common State Machine Patterns

**Pattern 1 — Resource Leak (unclosed database connection):**
```xml
<StateMachine>
  <State name="start" initial="true"/>
  <State name="connected"/>
  <State name="closed" accepting="false"/>
  <State name="leaked" accepting="true"/>

  <Transition from="start" to="connected">
    <FunctionCall className="java.sql.DriverManager" methodName="getConnection"/>
  </Transition>
  <Transition from="connected" to="closed">
    <FunctionCall methodName="close" instanceOf="java.sql.Connection"/>
  </Transition>
  <Transition from="connected" to="leaked">
    <ReturnStatement/>
  </Transition>
  <Transition from="connected" to="leaked">
    <ThrowStatement/>
  </Transition>
</StateMachine>
```

**Pattern 2 — Missing authentication check before privileged operation:**
```xml
<StateMachine>
  <State name="start" initial="true"/>
  <State name="authenticated"/>
  <State name="safe" accepting="false"/>
  <State name="unauthorized" accepting="true"/>

  <!-- Authentication was checked -->
  <Transition from="start" to="authenticated">
    <FunctionCall className="com.example.SecurityContext" methodName="isAuthenticated"/>
  </Transition>
  <!-- Operation performed after auth check: safe -->
  <Transition from="authenticated" to="safe">
    <FunctionCall className="com.example.AdminService" methodName="deleteUser"/>
  </Transition>
  <!-- Operation performed WITHOUT auth check: error -->
  <Transition from="start" to="unauthorized">
    <FunctionCall className="com.example.AdminService" methodName="deleteUser"/>
  </Transition>
</StateMachine>
```

**Pattern 3 — Transaction without rollback:**
```xml
<StateMachine>
  <State name="start" initial="true"/>
  <State name="inTransaction"/>
  <State name="committed" accepting="false"/>
  <State name="rolledBack" accepting="false"/>
  <State name="leaked" accepting="true"/>

  <Transition from="start" to="inTransaction">
    <FunctionCall methodName="beginTransaction" instanceOf="javax.persistence.EntityManager"/>
  </Transition>
  <Transition from="inTransaction" to="committed">
    <FunctionCall methodName="commit" instanceOf="javax.persistence.EntityTransaction"/>
  </Transition>
  <Transition from="inTransaction" to="rolledBack">
    <FunctionCall methodName="rollback" instanceOf="javax.persistence.EntityTransaction"/>
  </Transition>
  <!-- Exception thrown without rollback -->
  <Transition from="inTransaction" to="leaked">
    <ThrowStatement/>
  </Transition>
  <Transition from="inTransaction" to="leaked">
    <ReturnStatement/>
  </Transition>
</StateMachine>
```

**Pattern 4 — Cryptographic key reuse (same key used for encrypt and sign):**
```xml
<StateMachine>
  <State name="start" initial="true"/>
  <State name="keyForEncryption"/>
  <State name="keyForSigning"/>
  <State name="safe" accepting="false"/>
  <State name="keyReuse" accepting="true"/>

  <Transition from="start" to="keyForEncryption">
    <FunctionCall className="javax.crypto.Cipher" methodName="init"/>
  </Transition>
  <Transition from="keyForEncryption" to="keyReuse">
    <FunctionCall className="java.security.Signature" methodName="initSign"/>
  </Transition>
  <Transition from="start" to="keyForSigning">
    <FunctionCall className="java.security.Signature" methodName="initSign"/>
  </Transition>
  <Transition from="keyForSigning" to="keyReuse">
    <FunctionCall className="javax.crypto.Cipher" methodName="init"/>
  </Transition>
  <Transition from="keyForEncryption" to="safe">
    <ReturnStatement/>
  </Transition>
  <Transition from="keyForSigning" to="safe">
    <ReturnStatement/>
  </Transition>
</StateMachine>
```

---

### FunctionCall Trigger Attributes

| Attribute | Description |
|-----------|-------------|
| `className` | Fully qualified class name (e.g., `java.sql.DriverManager`) |
| `methodName` | Method name to match |
| `instanceOf` | Match any method call on an object that is an instance of this type |
| `returnType` | Filter by return type |

Use `instanceOf` when the exact class is unknown but you know the type hierarchy (e.g., match `close()` on any `Closeable`).

---

### When to Use ControlFlowRule vs Other Rule Types

| Scenario | Rule type |
|----------|-----------|
| Tainted data flows from user input to a dangerous call | DataflowSinkRule |
| A function is always dangerous when called | DataflowSinkRule |
| A code pattern is structurally invalid (empty catch block, missing annotation) | StructuralRule |
| A resource must be released after acquisition | ControlFlowRule |
| Two specific calls must happen in order | ControlFlowRule |
| A security check must precede a privileged operation | ControlFlowRule |
| A resource is used after it has been released (use-after-free pattern) | ControlFlowRule |

---

### Limitations

- ControlFlowRule analysis is intraprocedural by default — it tracks state within a single method. It does not follow state across method call boundaries unless Fortify's interprocedural analysis propagates the relevant object.
- State machines for complex multi-resource lifecycles can become difficult to maintain. Keep each rule focused on a single resource type.
- The `instanceOf` attribute requires Fortify to have type information for the object — this is usually available for Java and .NET, but may be limited for dynamic languages.
