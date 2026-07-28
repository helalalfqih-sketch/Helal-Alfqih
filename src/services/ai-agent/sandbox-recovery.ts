/**
 * Sandbox Recovery & Automatic Rollback Engine — Gen 2 Agentic Engine 🔄
 *
 * Captures pre-execution snapshots of target codebase files and automatically
 * restores state if typecheck or production build steps fail.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface SandboxSnapshot {
  id: string;
  timestamp: string;
  files: Record<string, string>; // relPath -> originalContent
}

const snapshotsStore: Record<string, SandboxSnapshot> = {};
const PROJECT_ROOT = path.resolve(process.cwd());

/**
 * Capture file snapshot before executing any agent modification task
 */
export async function createSandboxSnapshot(
  taskId: string,
  targetFiles: string[],
): Promise<SandboxSnapshot> {
  const fileContents: Record<string, string> = {};

  for (const relPath of targetFiles) {
    try {
      const cleanPath = relPath.replace(/^[/\\]+/, "");
      const absPath = path.resolve(PROJECT_ROOT, cleanPath);
      fileContents[relPath] = await fs.readFile(absPath, "utf-8");
    } catch {
      // File does not exist yet (new file creation)
      fileContents[relPath] = "__FILE_DOES_NOT_EXIST__";
    }
  }

  const snapshot: SandboxSnapshot = {
    id: taskId,
    timestamp: new Date().toISOString(),
    files: fileContents,
  };

  snapshotsStore[taskId] = snapshot;
  return snapshot;
}

/**
 * Perform automatic rollback to snapshot state if build or testing fails
 */
export async function executeAutomaticRollback(taskId: string): Promise<{
  success: boolean;
  restoredFiles: string[];
  deletedFiles: string[];
}> {
  const snapshot = snapshotsStore[taskId];
  if (!snapshot) {
    return { success: false, restoredFiles: [], deletedFiles: [] };
  }

  const restoredFiles: string[] = [];
  const deletedFiles: string[] = [];

  for (const [relPath, content] of Object.entries(snapshot.files)) {
    try {
      const cleanPath = relPath.replace(/^[/\\]+/, "");
      const absPath = path.resolve(PROJECT_ROOT, cleanPath);

      if (content === "__FILE_DOES_NOT_EXIST__") {
        await fs.unlink(absPath).catch(() => {});
        deletedFiles.push(relPath);
      } else {
        await fs.mkdir(path.dirname(absPath), { recursive: true });
        await fs.writeFile(absPath, content, "utf-8");
        restoredFiles.push(relPath);
      }
    } catch (err) {
      console.warn(`[SandboxRecovery] Failed restoring ${relPath}:`, err);
    }
  }

  return { success: true, restoredFiles, deletedFiles };
}
