const { BASE_URL, REQUIRED_PARAMETERS } = require("./constants");
const AppStoreConnect = require("./app-store-connect");
const { Logger } = require("./logger");

module.exports = async function trigger(params) {
  const logger = new Logger({
    enabled: params.verbose || false,
    minLevel: params.logLevel || "INFO",
  });

  try {
    // Validate required parameters
    for (const param of REQUIRED_PARAMETERS) {
      if (!params[param]) {
        throw new Error(`Required parameter '${param}' is not provided`);
      }
    }

    const client = new AppStoreConnect(
      BASE_URL,
      params["appstore-connect-token"],
      {
        verbose: params.verbose || false,
        logLevel: params.logLevel,
      }
    );

    logger.info("🔍 Getting workflow information...");
    const workflowInfo = await client.getWorkflow(
      params["xcode-cloud-workflow-id"]
    );

    logger.info("📦 Using repository", {
      name: workflowInfo.repository.name,
      owner: workflowInfo.repository.owner,
    });

    logger.info(
      `🔍 Finding git reference for branch '${params["git-branch-name"]}'...`
    );
    const referenceId = await client.getGitReference(
      workflowInfo.repository.id,
      params["git-branch-name"]
    );

    logger.info("🚀 Starting Xcode Cloud build...");
    const { id: buildId, number: buildNumber } = await client.createBuild(
      params["xcode-cloud-workflow-id"],
      referenceId
    );

    logger.info("✅ Build successfully triggered", {
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
    logger.error("❌ Build trigger failed", {
      error: error.message,
      params: {
        ...params,
        "appstore-connect-token": "[REDACTED]",
      },
    });
    throw error;
  }
};
