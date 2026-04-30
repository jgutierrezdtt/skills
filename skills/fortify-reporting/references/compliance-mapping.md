## Use Case: Compliance Mapping

This reference covers mapping Fortify findings to compliance control frameworks: PCI DSS v4.0, SOC 2, HIPAA, and OWASP Top 10. Fortify categorizes findings by Fortify category, kingdom, and CWE — these map to compliance controls.

---

### Mapping Approach

Fortify does not natively output findings grouped by compliance framework. The mapping is done by filtering issues using `--query` on `category` and `kingdom` values, then associating them to control requirements.

For each framework, the approach is:
1. Identify which Fortify categories and kingdoms correspond to the control.
2. Run a filtered query to count or list matching issues.
3. Present findings per control requirement.

---

### OWASP Top 10 Mapping

OWASP Top 10 (2021) maps directly to Fortify kingdoms and common categories:

| OWASP Category | Fortify Kingdoms / Categories |
|---------------|-------------------------------|
| A01: Broken Access Control | Access Control |
| A02: Cryptographic Failures | Encapsulation, Privacy Violation, Weak Encryption |
| A03: Injection | Input Validation, SQL Injection, Command Injection, LDAP Injection |
| A04: Insecure Design | Code Quality |
| A05: Security Misconfiguration | System Configuration, Often Misused |
| A06: Vulnerable and Outdated Components | (covered by SCA/OSS analysis) |
| A07: Identification and Authentication Failures | Access Control, Password Management |
| A08: Software and Data Integrity Failures | Data Flow, Encapsulation |
| A09: Security Logging and Monitoring Failures | System Information Leakage |
| A10: Server-Side Request Forgery | Input Validation, SSRF |

**SSC — query by kingdom:**
```bash
fcli ssc issue list \
  --av "<AppName>:<VersionName>" \
  --query "kingdom=='Input Validation'" \
  -o json
```

**FoD — query by category (FoD exposes category directly):**
```bash
fcli fod issue list \
  --rel "<AppName>:<ReleaseName>" \
  --query "category=='SQL Injection'" \
  -o json
```

---

### PCI DSS v4.0 Mapping

Relevant PCI DSS v4.0 requirements that map to Fortify SAST findings:

| PCI DSS Requirement | Relevant Fortify Categories |
|--------------------|----------------------------|
| 6.2.4 — Prevent common software attacks | SQL Injection, XSS, Command Injection, Path Manipulation |
| 6.3.3 — Protect against known vulnerabilities | Identify unpatched code patterns (via SCA/OSS) |
| 6.4.1 — Web-facing app protection | Input Validation, Cross-Site Scripting |
| 4.2.1 — Strong cryptography for data in transit | Weak SSL/TLS, Insecure Transport |
| 3.5.1 — Protection of stored account data | Weak Encryption, Privacy Violation |
| 8.3 — Secure all authentication credentials | Password Management, Hardcoded Credentials |

**SSC — query PCI injection-related issues:**
```bash
fcli ssc issue list \
  --av "<AppName>:<VersionName>" \
  --query "kingdom=='Input Validation' && friority in ('Critical','High')" \
  -o json
```

**FoD:**
```bash
fcli fod issue list \
  --rel "<AppName>:<ReleaseName>" \
  --query "(category=='SQL Injection' || category=='Cross-Site Scripting' || category=='Command Injection') && severity in ('Critical','High')" \
  -o json
```

---

### HIPAA Mapping

HIPAA technical safeguard requirements that map to Fortify findings:

| HIPAA Safeguard | Relevant Fortify Categories |
|----------------|----------------------------|
| Access Control (164.312(a)) | Access Control, Hardcoded Credentials |
| Audit Controls (164.312(b)) | System Information Leakage, Log Forging |
| Transmission Security (164.312(e)) | Weak SSL/TLS, Insecure Transport |
| Integrity (164.312(c)) | Data Flow, SQL Injection |
| PHI Exposure | Privacy Violation |

**SSC — query privacy-related issues:**
```bash
fcli ssc issue list \
  --av "<AppName>:<VersionName>" \
  --query "kingdom=='Privacy Violation'" \
  -o json
```

---

### SOC 2 Mapping

SOC 2 Trust Service Criteria relevant to application security:

| SOC 2 Criterion | Relevant Fortify Categories |
|----------------|----------------------------|
| CC6.1 — Logical and physical access controls | Access Control, Hardcoded Credentials |
| CC6.6 — Prevent security threats from outside | Input Validation, XSS, SSRF |
| CC6.7 — Restrict transmission to authorized users | Weak Encryption, Insecure Transport |
| CC7.1 — Detect configuration vulnerabilities | System Configuration |
| CC8.1 — Change management controls | Code Quality, Dangerous Functions |

---

### Generating a Compliance Report Structure

When the user asks for a compliance report, structure the output as:

1. Framework and scope (application/version, scan date)
2. Per-control requirement: issue count by severity (Critical / High / Medium / Low)
3. Compliance gap summary: which controls have open Critical or High findings
4. Recommended remediation priority: controls with highest risk first

Always note that Fortify SAST does not cover all compliance controls — controls related to network configuration, physical security, or third-party component versioning require additional tooling (DAST, SCA, infrastructure scanning).
