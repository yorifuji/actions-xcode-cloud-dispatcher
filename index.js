const { BASE_URL, REQUIRED_PARAMETERS } = require("./constants");
const AppStoreConnect = require("./app-store-connect");

module.exports = async function trigger(params) {
  try {
    // Validate required parameters
    for (const param of REQUIRED_PARAMETERS) {
      if (!params[param]) {
        throw new Error(`Required parameter '${param}' is not provided`);
      }
    }

    const client = new AppStoreConnect(
      BASE_URL,
      params["appstore-connect-token"]
    );

    console.log("🔍 Getting workflow information...");
    const workflowInfo = await client.getWorkflow(
      params["xcode-cloud-workflow-id"]
    );

    console.log("📦 Using repository:", {
      name: workflowInfo.repository.name,
      owner: workflowInfo.repository.owner,
    });

    console.log(
      `🔍 Finding git reference for branch '${params["git-branch-name"]}'...`
    );
    const referenceId = await client.getGitReference(
      workflowInfo.repository.id,
      params["git-branch-name"]
    );

    console.log("🚀 Starting Xcode Cloud build...");
    const { id: buildId, number: buildNumber } = await client.createBuild(
      params["xcode-cloud-workflow-id"],
      referenceId
    );

    console.log("✅ Build successfully triggered:", {
      buildNumber,
      repository: workflowInfo.repository.name,
      branch: params["git-branch-name"],
    });

    return {
      buildId,
      buildNumber,
      gitReferenceId: referenceId,
    };
  } catch (error) {
    console.error("❌ Error:", error.message);
    throw error;
  }
};
