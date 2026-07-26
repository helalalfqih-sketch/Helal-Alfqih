/**
 * Agent State — Session State Management
 *
 * Tracks the in-memory runtime state of an agent session:
 * current mode, active task, pending approval, retry state.
 */

import type { AgentPlanStep } from "./agent.events";

// ─────────────────────────────────────────────────
// Agent Mode
// ─────────────────────────────────────────────────

export type AgentMode =
  | "chat"     // 💬 يشرح فقط — لا يخطط ولا ينفذ
  | "plan"     // 📋 يخطط فقط — لا ينفذ
  | "execute"  // ⚙️ ينفذ بعد موافقة المستخدم
  | "auto";    // 🤖 تنفيذ كامل ضمن الصلاحيات (لاحق)

// ─────────────────────────────────────────────────
// Task Status
// ─────────────────────────────────────────────────

export type TaskStatus =
  | "analyzing"
  | "planning"
  | "waiting_approval"
  | "executing"
  | "testing"
  | "completed"
  | "failed"
  | "cancelled";

// ─────────────────────────────────────────────────
// Active Task
// ─────────────────────────────────────────────────

export interface ActiveTask {
  taskId: string;
  status: TaskStatus;
  plan: AgentPlanStep[];
  affectedFiles: string[];
  riskLevel: "low" | "medium" | "high" | "critical";
  currentStep: number;
  userApproved: boolean;
  startedAt: number;
  completedAt?: number;
}

// ─────────────────────────────────────────────────
// Retry State
// ─────────────────────────────────────────────────

export interface RetryState {
  attempt: number;
  maxAttempts: number;
  modelFallbacks: string[];
  currentModelIndex: number;
  lastError?: string;
}

// ─────────────────────────────────────────────────
// Agent Session State
// ─────────────────────────────────────────────────

export interface AgentSessionState {
  sessionId: string;
  tenantId: string;
  mode: AgentMode;
  activeTask: ActiveTask | null;
  retry: RetryState;
  filesRead: string[];           // for activity stream
  toolsUsed: string[];           // for activity log
  createdAt: number;
  lastActivityAt: number;
}

// ─────────────────────────────────────────────────
// State Factory
// ─────────────────────────────────────────────────

export function createSessionState(
  sessionId: string,
  tenantId: string,
  mode: AgentMode = "execute",
): AgentSessionState {
  return {
    sessionId,
    tenantId,
    mode,
    activeTask: null,
    retry: {
      attempt: 0,
      maxAttempts: 3,
      modelFallbacks: ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-1.5-flash"],
      currentModelIndex: 0,
    },
    filesRead: [],
    toolsUsed: [],
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
  };
}

export function createActiveTask(
  taskId: string,
  plan: AgentPlanStep[],
  affectedFiles: string[],
  riskLevel: "low" | "medium" | "high" | "critical" = "low",
): ActiveTask {
  return {
    taskId,
    status: "planning",
    plan,
    affectedFiles,
    riskLevel,
    currentStep: 0,
    userApproved: false,
    startedAt: Date.now(),
  };
}

export function advanceTaskStep(task: ActiveTask): ActiveTask {
  return {
    ...task,
    currentStep: task.currentStep + 1,
    lastActivityAt: Date.now(),
  } as ActiveTask & { lastActivityAt: number };
}

export function approveTask(task: ActiveTask): ActiveTask {
  return { ...task, status: "executing", userApproved: true };
}

export function completeTask(task: ActiveTask): ActiveTask {
  return { ...task, status: "completed", completedAt: Date.now() };
}

export function failTask(task: ActiveTask): ActiveTask {
  return { ...task, status: "failed", completedAt: Date.now() };
}
