## Jenkins

Fortify provides official Jenkins plugins for both FoD and SSC:

| Fortify Deployment | Plugin | URL |
|---|---|---|
| Fortify on Demand (FoD) | Fortify on Demand Uploader | https://plugins.jenkins.io/fortify-on-demand-uploader/ |
| Fortify SSC | Fortify | https://plugins.jenkins.io/fortify/ |

### Guidance

1. Direct the user to install the appropriate plugin from the Jenkins Plugin Manager (or via the URL above).
2. After directing the user to install, fetch the plugin page to get current configuration options, pipeline step names, and credential requirements before generating any `Jenkinsfile` content. Do not guess step names or parameters.
3. Store credentials using Jenkins Credentials (Username/Password or Secret Text credential types). `FOD_URL` / `SSC_URL` should be plain environment variables or pipeline parameters, not credential entries.