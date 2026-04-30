## Use Case: Custom Action Reports

This reference covers automating report generation using fcli custom actions. A custom action is a YAML-defined workflow that can run a sequence of fcli commands, transform output, and produce a report artifact — suitable for scheduling in CI/CD pipelines or cron jobs.

For the custom action YAML schema and syntax reference, load `skills/fcli-common/references/action-yaml-reference.md` and `skills/fcli-common/references/fcli-custom-actions.md`.

---

### When to Use a Custom Action for Reporting

Use a custom action when:
- The same report needs to run on a schedule (nightly, weekly, per release)
- The report requires multiple fcli queries combined into a single artifact
- The report output needs to be written to a file (JSON, CSV, or Markdown)
- The report logic needs to be versioned and shared across teams

For one-off queries, use standard fcli commands directly.

---

### Custom Action Report Pattern

A reporting custom action follows this structure:

1. **Login step** — authenticate to FoD or SSC using stored credentials
2. **Data collection steps** — one or more `fcli fod` or `fcli ssc` commands with `--store` to capture results
3. **Output step** — write the collected data to a file using the `write-file` action step or `--output` flag
4. **Logout step** — terminate the session

---

### Minimal Report Action Structure

```yaml
header:
  name: security-posture-report
  version: 1.0
  usage:
    header: Generate a security posture report for a single FoD release

steps:
  - progress: "Collecting issue data for {{release}}"
  - run: fcli fod issue list --rel "{{release}}" --query "severity in ('Critical','High')" -o json
    store: criticalHigh
  - run: fcli fod release list --query "releaseName=='{{release}}'" --include-fields isPassed,criticalIssueCount -o json
    store: policyStatus
  - write-file:
      path: "{{outputPath}}/report.json"
      content: |
        {
          "release": "{{release}}",
          "policyStatus": ${policyStatus},
          "criticalHighIssues": ${criticalHigh}
        }
```

Replace placeholder YAML with actual syntax from `action-yaml-reference.md` — do not guess parameter names.

---

### Running a Custom Action Report

**Run a custom action from a local file:**
```bash
fcli action run --from-file ./security-posture-report.yaml \
  --release "<AppName>:<ReleaseName>" \
  --outputPath ./reports
```

**Run a published action from the Fortify action store:**
```bash
fcli action run <action-name> [parameters]
```

Check available published actions:
```bash
fcli action list
```

---

### Scheduling via CI/CD

To schedule a report action in a pipeline, add a dedicated report job that runs after the scan job:

**GitHub Actions pattern:**
```yaml
report:
  runs-on: ubuntu-latest
  needs: [scan]
  steps:
    - uses: fortify/github-action/setup@v1
    - run: fcli action run security-posture-report --rel "${{ env.APP }}:${{ env.RELEASE }}" --outputPath ./reports
    - uses: actions/upload-artifact@v4
      with:
        name: security-report
        path: ./reports/
```

**GitLab CI pattern:**
```yaml
security-report:
  stage: report
  needs: [scan]
  script:
    - fcli action run security-posture-report --rel "$APP:$RELEASE" --outputPath ./reports
  artifacts:
    paths:
      - reports/
```

For Azure DevOps and Jenkins pipeline integration patterns, load `fortify-cicd-integration` skill references.

---

### Output Formats

Custom action reports can produce:

| Format | Use case |
|--------|---------|
| JSON | Machine-readable, for SIEM or dashboard ingestion |
| CSV | Spreadsheet distribution, compliance audit exports |
| Markdown | GitHub/GitLab PR comments, wiki documentation |

Choose format based on the report consumer. Always confirm with the user before writing to a path that may overwrite existing reports.
