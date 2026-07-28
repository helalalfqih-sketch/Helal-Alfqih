/**
 * Deep Dependency Graph Engine — Gen 2 Agentic Engine 🕸️
 *
 * Scans AST import statements, export symbols, and database references
 * to build an interconnected dependency graph of the codebase.
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface DependencyLink {
  sourceFile: string;
  targetFile: string;
  importSymbols: string[];
  isDynamic: boolean;
}

export interface DeepDependencyTree {
  rootFile: string;
  directDependencies: string[];
  transitiveDependencies: string[];
  databaseTables: string[];
  serverFunctions: string[];
  impactScore: number;
}

const PROJECT_ROOT = path.resolve(process.cwd());

/**
 * Scan target file and extract all imports and imported symbols
 */
export async function extractFileImports(filePath: string): Promise<DependencyLink[]> {
  const links: DependencyLink[] = [];
  try {
    const cleanPath = filePath.replace(/^[/\\]+/, "");
    const absPath = path.resolve(PROJECT_ROOT, cleanPath);
    const content = await fs.readFile(absPath, "utf-8");

    // Match static imports: import { a, b } from "c" or import d from "e"
    const staticImportRegex = /import\s+(?:\{([^}]+)\}|([^{}\s;]+))\s+from\s+['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;

    while ((match = staticImportRegex.exec(content)) !== null) {
      const destructured = match[1] ? match[1].split(",").map((s) => s.trim()) : [];
      const defaultImport = match[2] ? [match[2].trim()] : [];
      const targetModule = match[3];

      links.push({
        sourceFile: filePath,
        targetFile: targetModule,
        importSymbols: [...destructured, ...defaultImport].filter(Boolean),
        isDynamic: false,
      });
    }

    // Match dynamic imports: import("...")
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(content)) !== null) {
      links.push({
        sourceFile: filePath,
        targetFile: match[1],
        importSymbols: ["*"],
        isDynamic: true,
      });
    }
  } catch {
    // Unreadable file
  }

  return links;
}

/**
 * Build deep transitive dependency tree starting from a root file
 */
export async function buildDeepDependencyTree(
  rootFile: string,
  maxDepth = 3,
): Promise<DeepDependencyTree> {
  const visited = new Set<string>();
  const directDeps: string[] = [];
  const transitiveDeps: string[] = [];
  const dbTables: Set<string> = new Set();
  const serverFunctions: Set<string> = new Set();

  async function traverse(currentFile: string, depth: number) {
    if (depth > maxDepth || visited.has(currentFile)) return;
    visited.add(currentFile);

    const links = await extractFileImports(currentFile);
    for (const link of links) {
      const target = link.targetFile;

      if (depth === 1) directDeps.push(target);
      else if (depth > 1) transitiveDeps.push(target);

      if (target.includes(".functions.ts") || target.includes(".server.ts")) {
        serverFunctions.add(target);
      }

      await traverse(target, depth + 1);
    }

    // Inspect DB table references inside file
    try {
      const cleanPath = currentFile.replace(/^[/\\]+/, "");
      const absPath = path.resolve(PROJECT_ROOT, cleanPath);
      const content = await fs.readFile(absPath, "utf-8");
      const tableMatches = content.match(/\.from\s*\(\s*['"]([a-z_]+)['"]\s*\)/g) || [];

      for (const tm of tableMatches) {
        const tableName = tm.replace(/\.from\s*\(\s*['"]/, "").replace(/['"]\s*\)/, "");
        if (tableName) dbTables.add(tableName);
      }
    } catch {
      // Ignore
    }
  }

  await traverse(rootFile, 1);

  const impactScore = Math.min(
    100,
    directDeps.length * 10 + transitiveDeps.length * 2 + dbTables.size * 15,
  );

  return {
    rootFile,
    directDependencies: Array.from(new Set(directDeps)),
    transitiveDependencies: Array.from(new Set(transitiveDeps)),
    databaseTables: Array.from(dbTables),
    serverFunctions: Array.from(serverFunctions),
    impactScore,
  };
}
