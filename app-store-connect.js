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

    const data = await response.json();

    if (!response.ok) {
      const error = {
        status: response.status,
        statusText: response.statusText,
        data,
      };

      const errorMessages = {
        401: "Authentication failed. Please check your API token",
        403: "Authorization failed. Please check your permissions",
        404: `${options.errorContext || "Resource"} not found`,
        409: "Conflict occurred. The request conflicts with another request or the current state",
      };

      const errorMessage =
        errorMessages[error.status] ||
        `API request failed: ${error.statusText}`;
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
