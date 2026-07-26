/**
 * Agent Diff Engine — Phase 7.1 🧬
 *
 * Provides Unified Diff Generation, Validation, Conflict Detection, and Change Summaries.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface FileDiffSummary {
  filePath: string;
  additions: number;
  deletions: number;
  unifiedDiff: string;
}

export interface ProjectDiffReport {
  totalFiles: number;
  totalAdditions: number;
  totalDeletions: number;
  files: FileDiffSummary[];
}

/**
 * Generate a clean Unified Diff with additions (+) and deletions (-) metrics.
 */
export function generateFileDiff(
  filePath: string,
  originalContent: string,
  newContent: string,
): FileDiffSummary {
  const origLines = originalContent ? originalContent.split("\n") : [];
  const newLines = newContent ? newContent.split("\n") : [];

  const diffLines: string[] = [`--- a/${filePath}`, `+++ b/${filePath}`];
  let additions = 0;
  let deletions = 0;

  let i = 0;
  let j = 0;

  while (i < origLines.length || j < newLines.length) {
    if (i < origLines.length && j < newLines.length && origLines[i] === newLines[j]) {
      diffLines.push(` ${origLines[i]}`);
      i++;
      j++;
    } else if (i < origLines.length && (j >= newLines.length || origLines[i] !== newLines[j])) {
      diffLines.push(`-${origLines[i]}`);
      deletions++;
      i++;
    } else if (j < newLines.length) {
      diffLines.push(`+${newLines[j]}`);
      additions++;
      j++;
    }
  }

  return {
    filePath,
    additions,
    deletions,
    unifiedDiff: diffLines.join("\n"),
  };
}

/**
 * Validate unified diff structure.
 */
export function validateDiff(diffText: string): { valid: boolean; error?: string } {
  if (!diffText || typeof diffText !== "string") {
    return { valid: false, error: "نص الفرق (Diff) فارغ أو غير صالح." };
  }
  if (!diffText.includes("---") || !diffText.includes("+++")) {
    return { valid: false, error: "صيغة Unified Diff غير تامة الهيكل." };
  }
  return { valid: true };
}

/**
 * Detect conflict: Checks if the target file on disk was altered since proposal creation.
 */
export async function detectFileConflict(
  filePath: string,
  expectedOriginalContent: string,
): Promise<{ hasConflict: boolean; currentContent?: string; reason?: string }> {
  try {
    const absPath = path.resolve(process.cwd(), filePath.replace(/^[/\\]+/, ""));
    const currentOnDisk = await fs.readFile(absPath, "utf-8");

    if (expectedOriginalContent && currentOnDisk !== expectedOriginalContent) {
      return {
        hasConflict: true,
        currentContent: currentOnDisk,
        reason: `تم تعديل الملف "${filePath}" على القرص بعد صياغة المقترح.`,
      };
    }
    return { hasConflict: false, currentContent: currentOnDisk };
  } catch {
    // If file does not exist on disk, conflict only if expectedOriginalContent was not empty
    if (expectedOriginalContent) {
      return {
        hasConflict: true,
        reason: `الملف "${filePath}" غير موجود على القرص بينما يتوقع وجود محتوى سابق.`,
      };
    }
    return { hasConflict: false };
  }
}

/**
 * Summarize overall project diff across multiple files.
 */
export function summarizeProjectDiff(diffs: Record<string, string>): ProjectDiffReport {
  let totalAdditions = 0;
  let totalDeletions = 0;
  const fileSummaries: FileDiffSummary[] = [];

  for (const [filePath, diffText] of Object.entries(diffs)) {
    const lines = diffText.split("\n");
    let additions = 0;
    let deletions = 0;

    for (const l of lines) {
      if (l.startsWith("+") && !l.startsWith("+++")) additions++;
      else if (l.startsWith("-") && !l.startsWith("---")) deletions++;
    }

    totalAdditions += additions;
    totalDeletions += deletions;

    fileSummaries.push({
      filePath,
      additions,
      deletions,
      unifiedDiff: diffText,
    });
  }

  return {
    totalFiles: Object.keys(diffs).length,
    totalAdditions,
    totalDeletions,
    files: fileSummaries,
  };
}
