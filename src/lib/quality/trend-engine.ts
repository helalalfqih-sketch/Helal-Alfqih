/**
 * Phase 3 — Trend Engine
 * Analyzes quality trends across historical runs
 */
import fs from "fs";
import path from "path";
import { QualityReportSummary } from "./history";

export interface QualityTrendPoint {
  timestamp: string;
  overallScore: number;
  grade: string;
  status: string;
  passedCount: number;
  failedCount: number;
}

export interface TrendAnalysis {
  totalRunsScanned: number;
  trendDirection: "IMPROVING" | "STABLE" | "DEGRADING";
  points: QualityTrendPoint[];
}

export function analyzeQualityTrends(limit = 30): TrendAnalysis {
  const historyDir = path.resolve(process.cwd(), "reports", "history");
  if (!fs.existsSync(historyDir)) {
    return { totalRunsScanned: 0, trendDirection: "STABLE", points: [] };
  }

  try {
    const files = fs.readdirSync(historyDir).filter((f) => f.endsWith(".json")).sort().reverse().slice(0, limit);
    const points: QualityTrendPoint[] = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(historyDir, file), "utf-8");
      const data: QualityReportSummary = JSON.parse(content);
      points.push({
        timestamp: data.lastVerifiedAt,
        overallScore: data.overallScore,
        grade: data.grade,
        status: data.status,
        passedCount: data.passedCount,
        failedCount: data.failedCount,
      });
    }

    let trendDirection: "IMPROVING" | "STABLE" | "DEGRADING" = "STABLE";
    if (points.length >= 2) {
      const latest = points[0].overallScore;
      const previous = points[points.length - 1].overallScore;
      if (latest > previous) trendDirection = "IMPROVING";
      else if (latest < previous) trendDirection = "DEGRADING";
    }

    return {
      totalRunsScanned: points.length,
      trendDirection,
      points,
    };
  } catch {
    return { totalRunsScanned: 0, trendDirection: "STABLE", points: [] };
  }
}
