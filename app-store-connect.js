class AppStoreConnect {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  createHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    };
  }

  async request(path, options = {}) {
    const url = `${this.baseURL}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: this.createHeaders(),
    });

    if (process.env.ACTIONS_STEP_DEBUG === "true") {
      console.log(`🔍 Debug: ${options.debugContext || "API"} Response:`, {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      });
    }

    const data = await response.json();

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
        ref.attributes.name === branchName ||
        ref.attributes.name === `refs/heads/${branchName}`
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
