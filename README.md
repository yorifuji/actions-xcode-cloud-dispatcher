# Xcode Cloud Dispatcher

GitHub Actions to run Xcode Cloud workflows using the App Store Connect API.

## Setup

### 1. Generate JWT Token in Workflow

This action requires a JWT token to authenticate with the App Store Connect API. Here's an example using [yuki0n0/action-appstoreconnect-token](https://github.com/yuki0n0/action-appstoreconnect-token) to generate the token:

```yaml
- name: "Generate App Store Connect JWT Token"
  id: asc
  uses: yuki0n0/action-appstoreconnect-token@v1.0
  with:
    issuer id: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }}
    key id: ${{ secrets.APP_STORE_CONNECT_KEY_ID }}
    key: ${{ secrets.APP_STORE_CONNECT_PRIVATE_KEY }}
```

Required secrets:

| Secret Name                     | Description                                             |
| ------------------------------- | ------------------------------------------------------- |
| `APP_STORE_CONNECT_ISSUER_ID`   | App Store Connect API Issuer ID                         |
| `APP_STORE_CONNECT_KEY_ID`      | App Store Connect API key ID                            |
| `APP_STORE_CONNECT_PRIVATE_KEY` | App Store Connect API private key (contents of p8 file) |

To get these values:

1. Go to App Store Connect > Users and Access > Keys
2. Create a new key with "Admin" or "App Manager" or "Developer" role
3. Save the key information and .p8 file

The generated token will be used to authenticate the Xcode Cloud Dispatcher action.

### 2. Use Xcode Cloud Dispatcher Action

Once you have the JWT token generation step in your workflow, you can use this action to dispatch Xcode Cloud workflows.

#### Get Xcode Cloud Workflow ID

To dispatch a specific workflow in Xcode Cloud, you'll need its workflow ID. This is a unique identifier for each workflow you've configured in App Store Connect.

- Open [App Store Connect](https://appstoreconnect.apple.com)
- Navigate to your app
- Go to Settings > Xcode Cloud
- Select your workflow
- The workflow ID is in the URL: `https://appstoreconnect.apple.com/teams/{team-id}/apps/{app-id}/ci/workflows/{workflow-id}`

## Example Workflows

### Manual Dispatch Workflow Example

This example shows how to trigger Xcode Cloud workflows manually.

```yaml
name: "Manual Dispatch Workflow Example"

on:
  workflow_dispatch:
    inputs:
      xcode-cloud-workflow-id:
        description: "Xcode Cloud workflow ID to trigger"
        required: true
        type: string
      branch-name:
        description: "Branch name to trigger the workflow"
        required: true
        type: string
        default: "main"

permissions:
  contents: read

jobs:
  dispatch-xcode-cloud:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Generate JWT token
      - name: "Generate App Store Connect JWT Token"
        id: asc
        uses: yuki0n0/action-appstoreconnect-token@v1.0
        with:
          issuer id: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }}
          key id: ${{ secrets.APP_STORE_CONNECT_KEY_ID }}
          key: ${{ secrets.APP_STORE_CONNECT_PRIVATE_KEY }}

      # Dispatch Xcode Cloud workflow
      - name: "Dispatch Xcode Cloud Workflow"
        uses: yorifuji/actions-xcode-cloud-dispatcher@v1
        with:
          appstore-connect-token: ${{ steps.asc.outputs.token }}
          xcode-cloud-workflow-id: ${{ inputs.xcode-cloud-workflow-id }}
          git-branch-name: ${{ inputs.branch-name }}
```

### PR Comment Slash Command Workflow Example

This example shows how to trigger Xcode Cloud workflows using slash commands in pull request comments. When a user comments `/deploy` on a PR, it will trigger workflow for that PR's branch.

<img width="429" alt="image" src="https://github.com/user-attachments/assets/c0f18787-ee69-4889-9a57-1d28cc97f148" />

```yaml
name: Dispatch slash command

run-name: Dispatch slash command

on:
  issue_comment:
    types: [created]

permissions:
  contents: read
  pull-requests: read

jobs:
  dispatcher:
    if: ${{ github.event.issue.pull_request }}
    runs-on: ubuntu-latest
    outputs:
      command: ${{ steps.dispatch.outputs.command }}
    steps:
      - id: dispatch
        name: "Parse slash command from comment"
        uses: actions/github-script@v7
        with:
          script: |
            // List of supported slash commands
            const supportedCommands = ['deploy'].sort((a, b) => b.length - a.length);

            // Detect command from comment body
            const detectedCommand = supportedCommands.find(cmd =>
              context.payload.comment.body.startsWith(`/${cmd}`)
            );

            if (detectedCommand) {
              core.setOutput('command', detectedCommand);
            } else {
              core.setOutput('command', 'Unknown command');
            }

  deploy:
    needs: dispatcher
    if: ${{ needs.dispatcher.outputs.command == 'deploy' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: "Get branch from Issue number"
        id: issue
        uses: actions/github-script@v7
        with:
          script: |
            // Get PR info and extract branch name
            const { data: pullRequest } = await github.rest.pulls.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.issue.number
            });
            if (!pullRequest.head.ref) {
              core.setFailed('Failed to get branch name from pull request');
              return;
            }
            core.setOutput('branch-name', pullRequest.head.ref);

      - name: "Generate App Store Connect JWT Token"
        id: asc
        uses: yuki0n0/action-appstoreconnect-token@v1.0
        with:
          issuer id: ${{ secrets.APPLE_API_ISSUER_ID }}
          key id: ${{ secrets.APPLE_API_KEY_ID }}
          key: ${{ secrets.APPLE_API_AUTHKEY_P8 }}

      - name: "Dispatch Xcode Cloud Workflow"
        uses: yorifuji/actions-xcode-cloud-dispatcher@v1
        with:
          appstore-connect-token: ${{ steps.asc.outputs.token }}
          xcode-cloud-workflow-id: ${{ vars.XCODE_CLOUD_WORKFLOW_ID }}
          git-branch-name: ${{ steps.issue.outputs.branch-name }}
```

## Reference

### Action Inputs

| Name                      | Description                 | Required | Example                                |
| ------------------------- | --------------------------- | -------- | -------------------------------------- |
| `appstore-connect-token`  | App Store Connect API token | Yes      | JWT token                              |
| `xcode-cloud-workflow-id` | Xcode Cloud workflow ID     | Yes      | "12345678-90ab-cdef-1234-567890abcdef" |
| `git-branch-name`         | Git branch name             | Yes      | "main"                                 |

### Action Outputs

| Name             | Description                                       | Example          |
| ---------------- | ------------------------------------------------- | ---------------- |
| `buildNumber`    | The build number of the dispatched workflow       | "1234"           |
| `buildId`        | The ID of the dispatched workflow                 | "build-id-12345" |
| `gitReferenceId` | The ID of the git reference used for the workflow | "git-ref-67890"  |

## License

MIT License - see [LICENSE](LICENSE) for details
