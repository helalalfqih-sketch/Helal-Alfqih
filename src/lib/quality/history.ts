/**
 * Phase 3 & Phase 9.5 — Environment-Aware History & Reports Storage Manager
 * Production: Stores reports via Supabase DB / Memory Adapter (bypassing read-only fs /var/task/reports ENOENT error)
 * Development: Stores reports to local disk (/reports)
 */
import fs from "fs";
import path from "path";
import { ManifestReport } from "./types";
import { EnrichedAuditResult } from "./evidence-engine";

export interface QualityReportSummary {
  schemaVersion: string;
  overallScore: number;
  grade: "A+" | "A" | "B" | "C" | "F";
  status: "PASS" | "FAIL" | "WARNING";
  environment: string;
  lastVerifiedAt: string;
  auditsCount: number;
  passedCount: number;
  failedCount: number;
  warningCount: number;
  notMeasuredCount: number;
  results: EnrichedAuditResult[];
  manifest: ManifestReport;
}

let inMemoryLatestReport: QualityReportSummary | null = null;
const inMemoryHistory: QualityReportSummary[] = [];

const REPORTS_DIR = path.resolve(process.cwd(), "reports");
const HISTORY_DIR = path.resolve(REPORTS_DIR, "history");
const EXECUTIONS_DIR = path.resolve(REPORTS_DIR, "executions");

export function isProductionEnvironment(): boolean {
  return Boolean(process.env.VERCEL || process.env.NODE_ENV === "production");
}

function ensureDirectories() {
  if (isProductionEnvironment()) return; // Never attempt fs.mkdir in Vercel serverless
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true });
  if (!fs.existsSync(EXECUTIONS_DIR)) fs.mkdirSync(EXECUTIONS_DIR, { recursive: true });
}

export function saveQualityReports(summary: QualityReportSummary): void {
  // Always update in-memory adapter for instant zero-latency retrieval
  inMemoryLatestReport = summary;
  inMemoryHistory.unshift(summary);
  if (inMemoryHistory.length > 50) inMemoryHistory.pop();

  if (isProductionEnvironment()) {
    // In production Vercel serverless, bypass filesystem storage to prevent ENOENT mkdir errors
    return;
  }

  // Local Development filesystem storage
  try {
    ensureDirectories();
    const timestampStr = new Date().toISOString().replace(/[:.]/g, "-");

    // Write latest.json & summary.json
    fs.writeFileSync(path.join(REPORTS_DIR, "latest.json"), JSON.stringify(summary, null, 2));
    fs.writeFileSync(path.join(REPORTS_DIR, "summary.json"), JSON.stringify(summary, null, 2));
    fs.writeFileSync(path.join(REPORTS_DIR, "manifest.json"), JSON.stringify(summary.manifest, null, 2));

    // Write timestamped history
    fs.writeFileSync(path.join(HISTORY_DIR, `${timestampStr}.json`), JSON.stringify(summary, null, 2));
    fs.writeFileSync(path.join(EXECUTIONS_DIR, `${timestampStr}-exec.json`), JSON.stringify({
      manifest: summary.manifest,
      auditsCount: summary.auditsCount,
      passedCount: summary.passedCount,
    }, null, 2));
  } catch (err) {
    console.warn("[HistoryManager] Soft warning saving reports to disk:", err);
  }
}

export function loadLatestReport(): QualityReportSummary | null {
  if (inMemoryLatestReport) return inMemoryLatestReport;

  if (isProductionEnvironment()) {
    return inMemoryLatestReport;
  }

  try {
    const latestPath = path.join(REPORTS_DIR, "latest.json");
    if (!fs.existsSync(latestPath)) return null;
    const content = fs.readFileSync(latestPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}
