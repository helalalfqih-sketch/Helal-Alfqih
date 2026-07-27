/**
 * Phase 3 — History & Reports Storage Manager
 */
import fs from "fs";
import path from "path";
import { ManifestReport, QualityEngineInfo } from "./types";
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

const REPORTS_DIR = path.resolve(process.cwd(), "reports");
const HISTORY_DIR = path.resolve(REPORTS_DIR, "history");
const EXECUTIONS_DIR = path.resolve(REPORTS_DIR, "executions");

function ensureDirectories() {
  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  if (!fs.existsSync(HISTORY_DIR)) fs.mkdirSync(HISTORY_DIR, { recursive: true });
  if (!fs.existsSync(EXECUTIONS_DIR)) fs.mkdirSync(EXECUTIONS_DIR, { recursive: true });
}

export function saveQualityReports(summary: QualityReportSummary): void {
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
  try {
    const latestPath = path.join(REPORTS_DIR, "latest.json");
    if (!fs.existsSync(latestPath)) return null;
    const content = fs.readFileSync(latestPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}
