---
name: fortify-custom-rules
version: 1.0
tested-with:
  fcli: "3.18"
  fod: "26.1"
  ssc: "25.4"
always-in-context:
  - SKILL.md
on-demand:
  - references/rulepack-structure.md
  - references/rulepack-management.md
  - references/action-signing.md
  - references/taint-flags-reference.md
  - references/characterization-rules.md
  - references/suppression-rules.md
  - references/external-metadata.md
  - references/content-config-rules.md
  - references/control-flow-rules.md
  - references/framework-function-identifiers.md
---

# Fortify Custom Rules Skill

This skill covers extending Fortify SAST detection with custom rulepacks and extending the fcli automation layer with custom actions. It does not cover writing application code to fix vulnerabilities — for that, activate `fortify-remediate`.

Load this skill when the user is asking about:
- Creating new detection rules for Fortify SAST (custom rulepacks)
- Understanding the structure of existing Fortify rulepack XML
- Importing, activating, or deactivating rulepacks in SSC or FoD
- Writing custom fcli actions for automation or reporting workflows
- Signing and distributing custom fcli actions to a team

This skill focuses on the authoring and management workflow. The LLM already understands vulnerability patterns — these reference files guide the correct tool usage and file structure decisions.

---

## Two Extension Layers

Fortify has two distinct extension points. Confirm which one the user needs:

| Layer | What it does | Tooling |
|-------|-------------|---------|
| Custom rulepacks (SAST) | Add new vulnerability detection rules to the Fortify SAST analyzer | Fortify Audit Workbench / Fortify Rules Editor |
| Custom fcli actions | Automate fcli command sequences; extend scanning, reporting, and integration workflows | fcli action YAML |

These are independent. A user may need one, the other, or both.

---

## Platform Scope

| Area | FoD support | SSC support |
|------|------------|-------------|
| Custom rulepacks | Limited — Fortify manages rulepack updates on FoD; custom rulepacks must be approved via the FoD Custom Rules process | Full — import `.zip` or `.bin` via `fcli ssc rulepack import` |
| Custom fcli actions | Fully supported on both platforms | Fully supported on both platforms |

For custom rulepacks on FoD, direct the user to Fortify Professional Services or the FoD Custom Rules upload process — it is not self-service via fcli.

---

## Safety Rules

- Never import a rulepack from an untrusted or unverified source.
- Always test custom rules in a development or staging SSC environment before importing into production.
- Verify rulepack XML structure before import — malformed rulepacks can cause analysis failures for all versions on the instance.
- Sign custom fcli actions before distributing to a team — unsigned actions will not run in environments with signature enforcement enabled.

---

## Reference Files

| File | Load when... |
|------|-------------|
| `references/rulepack-structure.md` | The user wants to create or understand the XML structure of a custom rulepack |
| `references/rulepack-management.md` | The user wants to import, activate, deactivate, or remove rulepacks from SSC |
| `references/action-signing.md` | The user wants to sign and distribute a custom fcli action |
| `references/taint-flags-reference.md` | The user is authoring dataflow rules and needs to understand taint flags, conditional elements, or how sinks filter by flag |
| `references/characterization-rules.md` | The user needs to track taint through annotations, field access, or complex structural patterns (CharacterizationRule) |
| `references/suppression-rules.md` | The user wants to suppress false positives at the rulepack level or map custom types via AliasRule |
| `references/external-metadata.md` | The user wants to map custom rules to CWE, OWASP Top 10, PCI-DSS, or other compliance frameworks |
| `references/content-config-rules.md` | The user wants to detect misconfigurations in XML, JSON, YAML, properties, or manifest files |
| `references/control-flow-rules.md` | The user wants to detect resource leaks, missing security checks, or call-sequence violations |
| `references/framework-function-identifiers.md` | The user needs className/functionName values for FunctionIdentifier blocks (Spring, .NET, Django, Flask, Express, Go, Rails) |

## Use Case Index

| Request | File to load |
|---------|-------------|
| Create a new SAST detection rule | `references/rulepack-structure.md` |
| Understand rule types (dataflow, semantic, controlflow) | `references/rulepack-structure.md` |
| Import a rulepack into SSC | `references/rulepack-management.md` |
| Activate or deactivate a rulepack | `references/rulepack-management.md` |
| Export or backup rulepacks | `references/rulepack-management.md` |
| Sign a custom fcli action | `references/action-signing.md` |
| Distribute a signed action to a team | `references/action-signing.md` |
| Verify a signed action before running | `references/action-signing.md` |
| Understand taint flags (+WEB, +XSS, +SQL, etc.) | `references/taint-flags-reference.md` |
| Add conditional logic to a sink rule | `references/taint-flags-reference.md` |
| Use validated/neutral flags to reduce false positives | `references/taint-flags-reference.md` |
| Track taint from @RequestParam / @PathVariable annotations | `references/characterization-rules.md` |
| Create a CharacterizationRule with structural predicates | `references/characterization-rules.md` |
| Model taint for custom wrapper classes | `references/suppression-rules.md` (AliasRule) |
| Suppress findings in test or generated code globally | `references/suppression-rules.md` |
| Write a SuppressionRule to eliminate a known FP pattern | `references/suppression-rules.md` |
| Map a custom rule to CWE / OWASP / PCI-DSS | `references/external-metadata.md` |
| Add compliance framework mappings to existing rules | `references/external-metadata.md` |
| Detect a misconfiguration in AndroidManifest.xml | `references/content-config-rules.md` |
| Detect insecure Kubernetes or Docker configuration | `references/content-config-rules.md` |
| Detect Spring Boot, Django, or .NET config issues | `references/content-config-rules.md` |
| Detect resource leak (unclosed connection, stream) | `references/control-flow-rules.md` |
| Detect missing security check before privileged operation | `references/control-flow-rules.md` |
| Detect missing transaction rollback on exception | `references/control-flow-rules.md` |
| Find className/functionName for Spring / EF / Django sink rule | `references/framework-function-identifiers.md` |
| Author a source rule for Express / Flask / Go HTTP request | `references/framework-function-identifiers.md` |
