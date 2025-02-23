# GitHub Actions for Xcode Cloud Dispatch

GitHub Action to dispatch builds in Xcode Cloud using the App Store Connect API.

## Features

- 🚀 Dispatch Xcode Cloud builds from GitHub Actions
- 🔄 Automatically uses the current branch
- 📝 Clear build status and error reporting
- 🔒 Secure handling of App Store Connect API credentials

## Usage

1. Create App Store Connect API key with the following permissions:

   - Xcode Cloud (Access)

2. Add the following secrets to your repository:

   - `APP_STORE_CONNECT_ISSUER_ID`: Your App Store Connect API key issuer ID
   - `APP_STORE_CONNECT_KEY_ID`: Your App Store Connect API key ID
   - `APP_STORE_CONNECT_PRIVATE_KEY`: Your App Store Connect API private key

3. Create a workflow file (e.g., `.github/workflows/xcode-cloud-dispatch.yml`):

```yaml
name: "Xcode Cloud Dispatch"

on:
  workflow_dispatch:
    inputs:
      xcode_cloud_workflow_id:
        description: "Xcode Cloud workflow ID to trigger"
        required: true
        type: string

jobs:
  dispatch-xcode-cloud:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: "Generate App Store Connect JWT Token"
        id: asc
        uses: yuki0n0/action-appstoreconnect-token@v1.0
        with:
          issuer id: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }}
          key id: ${{ secrets.APP_STORE_CONNECT_KEY_ID }}
          key: ${{ secrets.APP_STORE_CONNECT_PRIVATE_KEY }}

      - name: "Dispatch Xcode Cloud Build"
        uses: yorifuji/actions-xcode-cloud-dispatcher@v1
        with:
          appstore-connect-token: ${{ steps.asc.outputs.token }}
          xcode-cloud-workflow-id: ${{ inputs.xcode_cloud_workflow_id }}
          git-branch-name: ${{ github.ref_name }}
```

## Inputs

| Name                      | Description                 | Required |
| ------------------------- | --------------------------- | -------- |
| `appstore-connect-token`  | App Store Connect API token | Yes      |
| `xcode-cloud-workflow-id` | Xcode Cloud workflow ID     | Yes      |
| `git-branch-name`         | Git branch name             | Yes      |

## Outputs

| Name             | Description                                    |
| ---------------- | ---------------------------------------------- |
| `buildNumber`    | The build number of the triggered build        |
| `buildId`        | The ID of the triggered build                  |
| `gitReferenceId` | The ID of the git reference used for the build |

## Finding Your Workflow ID

1. Open App Store Connect
2. Navigate to your app
3. Go to TestFlight > Xcode Cloud
4. Select your workflow
5. The workflow ID is in the URL: `https://appstoreconnect.apple.com/teams/{team-id}/cicd/workflows/{workflow-id}`

## Error Handling

The action provides detailed error messages for common issues:

- Authentication failures
- Missing or invalid workflow IDs
- Branch not found
- Repository access issues

## License

MIT License - see [LICENSE](LICENSE) for details
