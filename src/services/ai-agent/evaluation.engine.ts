/**
 * Evaluation Engine — Phase 9 📊
 *
 * Scores Indexes AI Engineering Agent decisions & executions:
 *   - Planning Score
 *   - Execution Score
 *   - Verification Score
 *   - Efficiency Score
 *   - Final Score (0 - 100)
 */

import { getAgentDb } from "@/lib/ai-agent.functions";

export interface EvaluationReport {
  taskId: string;
  planningScore: number;
  executionScore: number;
  verificationScore: number;
  efficiencyScore: number;
  finalScore: number;
  metadata: Record<string, any>;
}

export interface AgentPerformanceOverview {
  totalTasks: number;
  successRate: number; // 0 - 100 %
  failedTasks: number;
  rollbackCount: number;
  averageAttempts: number;
  averageScore: number;
}

/**
 * Calculate efficiency score based on affected files and retry attempts
 */
export function analyzePlanEfficiency(affectedFilesCount: number, retryAttempts: number): number {
  let score = 100;
  if (retryAttempts > 1) {
    score -= (retryAttempts - 1) * 20;
  }
  if (affectedFilesCount > 5) {
    score -= (affectedFilesCount - 5) * 5;
  }
  return Math.max(score, 20);
}

/**
 * Evaluate task execution and store metrics in ai_agent_evaluations
 */
export async function evaluateTaskExecution(params: {
  tenantId: string;
  taskId: string;
  buildSuccess: boolean;
  typecheckSuccess: boolean;
  retryAttempts?: number;
  affectedFilesCount?: number;
  rolledBack?: boolean;
}): Promise<EvaluationReport> {
  const {
    tenantId,
    taskId,
    buildSuccess,
    typecheckSuccess,
    retryAttempts = 1,
    affectedFilesCount = 1,
    rolledBack = false,
  } = params;

  let planningScore = 95;
  let executionScore = buildSuccess ? 100 : 30;
  let verificationScore = typecheckSuccess ? 100 : 20;

  if (rolledBack) {
    executionScore = 10;
    verificationScore = 10;
    planningScore = 50;
  }

  const efficiencyScore = analyzePlanEfficiency(affectedFilesCount, retryAttempts);

  // Weighted average score
  const finalScore = Math.round(
    planningScore * 0.2 + executionScore * 0.35 + verificationScore * 0.35 + efficiencyScore * 0.1,
  );

  const report: EvaluationReport = {
    taskId,
    planningScore,
    executionScore,
    verificationScore,
    efficiencyScore,
    finalScore,
    metadata: {
      buildSuccess,
      typecheckSuccess,
      retryAttempts,
      affectedFilesCount,
      rolledBack,
      timestamp: new Date().toISOString(),
    },
  };

  // Persist into DB
  try {
    const db = await getAgentDb({});
    await (db as any).from("ai_agent_evaluations").insert({
      tenant_id: tenantId,
      task_id: taskId,
      planning_score: planningScore,
      execution_score: executionScore,
      verification_score: verificationScore,
      efficiency_score: efficiencyScore,
      final_score: finalScore,
      metadata: report.metadata,
    });
  } catch (e) {
    console.warn("[EvaluationEngine] Failed to persist evaluation:", e);
  }

  return report;
}

/**
 * Calculate tenant overall Agent Performance metrics
 */
export async function getAgentPerformance(tenantId: string): Promise<AgentPerformanceOverview> {
  try {
    const db = await getAgentDb({});
    const { data: evals = [] } = await (db as any)
      .from("ai_agent_evaluations")
      .select("*")
      .eq("tenant_id", tenantId);

    const totalTasks = evals.length;
    if (totalTasks === 0) {
      return {
        totalTasks: 0,
        successRate: 100,
        failedTasks: 0,
        rollbackCount: 0,
        averageAttempts: 1,
        averageScore: 98,
      };
    }

    let successCount = 0;
    let failedTasks = 0;
    let rollbackCount = 0;
    let totalAttempts = 0;
    let sumScore = 0;

    for (const ev of evals) {
      const meta = ev.metadata || {};
      if (meta.buildSuccess && !meta.rolledBack) {
        successCount++;
      } else {
        failedTasks++;
      }
      if (meta.rolledBack) rollbackCount++;
      totalAttempts += meta.retryAttempts || 1;
      sumScore += ev.final_score || 0;
    }

    const successRate = Math.round((successCount / totalTasks) * 100);
    const averageAttempts = Number((totalAttempts / totalTasks).toFixed(1));
    const averageScore = Math.round(sumScore / totalTasks);

    return {
      totalTasks,
      successRate,
      failedTasks,
      rollbackCount,
      averageAttempts,
      averageScore,
    };
  } catch {
    return {
      totalTasks: 0,
      successRate: 100,
      failedTasks: 0,
      rollbackCount: 0,
      averageAttempts: 1,
      averageScore: 98,
    };
  }
}
