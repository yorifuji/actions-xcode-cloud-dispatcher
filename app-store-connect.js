const { Logger } = require("./logger");

class AppStoreConnect {
  constructor(baseURL, token, options = {}) {
    this.baseURL = baseURL;
    this.token = token;
    this.logger = new Logger({
      enabled: options.verbose || false,
      minLevel: options.logLevel || "INFO",
    });
  }

  createHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  async request(path, options = {}) {
    const url = `${this.baseURL}${path}`;
    const headers = this.createHeaders();
    const method = options.method || "GET";

    // Log request details
    this.logger.logApiRequest(method, path, {
      ...options,
      headers,
    });

    const startTime = Date.now();
    const response = await fetch(url, {
      ...options,
      headers,
    });
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Log response headers
    this.logger.logApiResponse(method, path, response, duration);

    const data = await response.json();

    // Log response body
    this.logger.logApiResponseBody(data);

    if (!response.ok) {
      const error = {
        status: response.status,
        statusText: response.statusText,
        data,
      };

      let errorMessage;
      switch (error.status) {
        case 401:
          errorMessage = "Authentication failed. Please check your API token.";
          break;
        case 403:
          errorMessage = "Authorization failed. Please check your permissions.";
          break;
        case 404:
          errorMessage = `${options.errorContext || "Resource"} not found.`;
          break;
        case 409:
          errorMessage =
            "Conflict occurred. The request conflicts with another request or the current state.";
          break;
        default:
          errorMessage = `API request failed: ${error.statusText}`;
      }

      this.logger.logApiError(
        {
          message: errorMessage,
          ...error,
        },
        {
          path,
          method,
          context: options.errorContext,
        }
      );
      throw new Error(errorMessage);
    }

    return data;
  }

  async getGitReference(repoId, branchName) {
    if (!repoId) throw new Error("Repository ID is required");
    if (!branchName) throw new Error("Branch name is required");

    const data = await this.request(
      `/scmRepositories/${repoId}/gitReferences`,
      {
        debugContext: "Git References",
        errorContext: "Git reference",
      }
    );

    const reference = data.data.find(
      (ref) =>
        ref?.attributes?.kind === "BRANCH" &&
        (ref.attributes.name === branchName ||
          ref.attributes.canonicalName === `refs/heads/${branchName}`)
    );

    if (!reference) {
      throw new Error(
        `No matching git reference found for branch '${branchName}'`
      );
    }

    return reference.id;
  }

  async createBuild(workflowId, referenceId) {
    if (!workflowId) throw new Error("Workflow ID is required");
    if (!referenceId) throw new Error("Git reference ID is required");

    const body = {
      data: {
        type: "ciBuildRuns",
        attributes: {},
        relationships: {
          workflow: {
            data: { type: "ciWorkflows", id: workflowId },
          },
          sourceBranchOrTag: {
            data: { type: "scmGitReferences", id: referenceId },
          },
        },
      },
    };

    const data = await this.request("/ciBuildRuns", {
      method: "POST",
      body: JSON.stringify(body),
      debugContext: "Build",
      errorContext: "Build",
    });

    return {
      id: data.data.id,
      number: data.data.attributes.number,
    };
  }

  async getWorkflow(workflowId) {
    if (!workflowId) throw new Error("Workflow ID is required");

    const repoData = await this.request(
      `/ciWorkflows/${workflowId}/repository`,
      {
        debugContext: "Workflow Repository",
        errorContext: "Workflow Repository",
      }
    );

    return {
      id: workflowId,
      repository: {
        id: repoData.data.id,
        name: repoData.data.attributes.repositoryName,
        owner: repoData.data.attributes.ownerName,
      },
    };
  }
}

module.exports = AppStoreConnect;
