/**
 * Enterprise Modular Quality Engine — Module Barrel Export
 */

export * from "./types";
export * from "./config";
export * from "./registry";
export * from "./manifest";
export * from "./engine";
export * from "./evidence-engine";
export * from "./report-generator";
export * from "./delta-engine";
export * from "./trend-engine";
export * from "./incident-correlation";
export * from "./ai-recommender";
export * from "./history";

import { AuditRegistry } from "./registry";
import { TypeScriptAuditor } from "./auditors/typescript.audit";
import { BuildAuditor } from "./auditors/build.audit";
import { DatabaseAuditor } from "./auditors/database.audit";
import { CodeMetricsAuditor } from "./auditors/code-metrics.audit";
import { ESLintAuditor } from "./auditors/eslint.audit";
import { DependencyAuditor } from "./auditors/dependency.audit";
import { EnvAuditor } from "./auditors/env.audit";
import { RoutesAuditor } from "./auditors/routes.audit";
import { RuntimeIncidentAuditor } from "./auditors/runtime-incident.audit";

// Auto-register Phase 2 Quality Auditors into Registry
const registry = AuditRegistry.getInstance();
registry.register(TypeScriptAuditor);
registry.register(BuildAuditor);
registry.register(DatabaseAuditor);
registry.register(CodeMetricsAuditor);
registry.register(ESLintAuditor);
registry.register(DependencyAuditor);
registry.register(EnvAuditor);
registry.register(RoutesAuditor);
registry.register(RuntimeIncidentAuditor);
