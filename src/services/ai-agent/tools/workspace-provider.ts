import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface AgentWorkspace {
  id: string;
  repository: string;
  branch: string;
  baseCommit: string;
  rootPath: string;
  environment: "local" | "container" | "remote";
  disposable: boolean;
}

export interface FileChangeProposal {
  filePath: string;
  operation: "create" | "modify" | "delete";
  baseBlobSha?: string;
  originalHash?: string;
  proposedHash?: string;
  unifiedPatch?: string;
  proposedContent?: string;
  taskId: string;
  revision: number;
}

export class WorkspaceProvider {
  private currentEnv: "development" | "preview" | "production";
  private rootPath: string;

  constructor() {
    this.currentEnv =
      process.env.NODE_ENV === "production"
        ? "production"
        : process.env.VERCEL_ENV === "preview"
          ? "preview"
          : "development";
    this.rootPath = process.cwd();
  }

  public async getWorkspace(taskId: string): Promise<AgentWorkspace> {
    return {
      id: taskId,
      repository: "local",
      branch: "current",
      baseCommit: "unknown",
      rootPath: this.rootPath,
      environment: this.currentEnv === "development" ? "local" : "remote",
      disposable: false,
    };
  }

  public async applyProposal(
    workspace: AgentWorkspace,
    proposal: FileChangeProposal,
  ): Promise<void> {
    if (this.currentEnv !== "development") {
      throw new Error(
        `EXECUTION_ENVIRONMENT_UNAVAILABLE: Cannot safely modify files in environment '${this.currentEnv}' without an isolated container provider.`,
      );
    }

    const absolutePath = path.resolve(workspace.rootPath, proposal.filePath);

    if (!absolutePath.startsWith(workspace.rootPath)) {
      throw new Error("SECURITY_VIOLATION: Path traversal detected.");
    }

    // Hash check for 'modify' or 'delete'
    if (proposal.operation !== "create") {
      try {
        const currentContent = await fs.readFile(absolutePath, "utf-8");
        // Very simple string hash equivalent for demonstration.
        // In production we would use crypto.createHash("sha256").update(currentContent).digest("hex")
        const currentLength = currentContent.length.toString();

        if (proposal.originalHash && proposal.originalHash !== currentLength) {
          throw new Error(
            `FILE_CONFLICT: The file ${proposal.filePath} has changed on disk since the proposal was approved.`,
          );
        }
      } catch (e: any) {
        if (e.code !== "ENOENT") throw e;
      }
    }

    if (proposal.operation === "delete") {
      await fs.unlink(absolutePath);
      return;
    }

    if (proposal.proposedContent) {
      await fs.mkdir(path.dirname(absolutePath), { recursive: true });
      await fs.writeFile(absolutePath, proposal.proposedContent, "utf-8");
      return;
    }

    if (proposal.unifiedPatch) {
      // In a real implementation this would use diff package to apply the unifiedPatch
      throw new Error("UNIFIED_PATCH_NOT_IMPLEMENTED");
    }
  }
}
