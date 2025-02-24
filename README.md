# Actions Xcode Cloud Dispatcher

GitHub Actions for dispatch builds in Xcode Cloud using the App Store Connect API.

## Setup Guide

1. Create App Store Connect API key:

   - Go to App Store Connect > Users and Access > Keys
   - Click the "+" button to create a new key
   - Select "Admin" or "App Manager" or "Developer" role
   - Download and safely store your API key file

2. Add the following secrets to your repository:

   - Go to your repository Settings > Secrets and variables > Actions
   - Add the following secrets:
     - `APP_STORE_CONNECT_ISSUER_ID`: Your App Store Connect API key issuer ID
     - `APP_STORE_CONNECT_KEY_ID`: Your App Store Connect API key ID
     - `APP_STORE_CONNECT_PRIVATE_KEY`: Your App Store Connect API private key (entire contents of the .p8 file)

3. Create a workflow file (e.g., `.github/workflows/xcode-cloud-dispatch.yml`):

```yaml
name: "Xcode Cloud Dispatch"

on:
  workflow_dispatch:
    inputs:
      xcode-cloud-workflow-id:
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
          xcode-cloud-workflow-id: ${{ inputs.xcode-cloud-workflow-id }}
          git-branch-name: ${{ github.ref_name }}
```

## Inputs

| Name                      | Description                 | Required | Example                                |
| ------------------------- | --------------------------- | -------- | -------------------------------------- |
| `appstore-connect-token`  | App Store Connect API token | Yes      | JWT token                              |
| `xcode-cloud-workflow-id` | Xcode Cloud workflow ID     | Yes      | "12345678-90ab-cdef-1234-567890abcdef" |
| `git-branch-name`         | Git branch name             | Yes      | "main" or "feature/new-feature"        |

## Outputs

| Name             | Description                                    | Example          |
| ---------------- | ---------------------------------------------- | ---------------- |
| `buildNumber`    | The build number of the triggered build        | "1234"           |
| `buildId`        | The ID of the triggered build                  | "build-id-12345" |
| `gitReferenceId` | The ID of the git reference used for the build | "git-ref-67890"  |

## Finding Your Workflow ID

1. Open [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app
3. Go to Settings > Xcode Cloud
4. Select your workflow
5. The workflow ID is in the URL: `https://appstoreconnect.apple.com/teams/{team-id}/apps/{app-id}/ci/workflows/{workflow-id}`

## License

MIT License - see [LICENSE](LICENSE) for details
