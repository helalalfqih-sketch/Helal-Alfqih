export type IncidentLevel = "error" | "warn" | "fatal" | "info";
export type IncidentStatus = "open" | "investigating" | "resolved" | "ignored";

export interface IncidentRecord {
  id: string;
  tenant_id: string | null;
  fingerprint: string;
  level: IncidentLevel;
  title: string;
  message: string;
  stack_trace?: string | null;
  source: string;
  context?: Record<string, any> | null;
  occurrences_count: number;
  first_seen_at: string;
  last_seen_at: string;
  status: IncidentStatus;
}

export interface IncidentStats {
  total: number;
  open: number;
  fatal: number;
  warning: number;
  resolved: number;
}

export interface IncidentIngestionPayload {
  level?: IncidentLevel;
  title?: string;
  message: string;
  stackTrace?: string;
  source?: string;
  context?: Record<string, any>;
  statusCode?: number;
  responseBody?: any;
}
