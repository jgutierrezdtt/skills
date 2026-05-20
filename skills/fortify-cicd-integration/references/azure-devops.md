## Azure DevOps

Fortify provides an official extension for Azure DevOps Pipelines:

**Extension**: [OpenText Fortify on Azure DevOps Marketplace](https://marketplace.visualstudio.com/items?itemName=fortifyvsts.hpe-security-fortify-vsts)

### Guidance

1. Direct the user to install the extension from the Azure DevOps Marketplace at the URL above.
2. The extension supports both FoD and SSC and provides pipeline tasks that can be added to `azure-pipelines.yml`.
3. After directing the user to install, fetch the marketplace page or the extension's documentation to get current task names, inputs, and version information before generating any pipeline YAML. Do not guess task names or input parameters.
4. Keep credentials in Azure DevOps pipeline secrets (variable groups marked as secret, or Azure Key Vault-linked variables). `FOD_URL` / `SSC_URL` should be plain pipeline variables, not secrets.
