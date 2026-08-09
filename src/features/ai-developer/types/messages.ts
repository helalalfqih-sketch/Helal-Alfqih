export interface BaseBlock {
  state?: "pending" | "running" | "completed" | "failed" | "success" | "error";
  title?: string;
  durationMs?: number;
  startedAt?: string | number | Date;
  result?: any;
}

export interface ToolCallBlock extends BaseBlock {
  type: "tool-call";
  toolName: string;
  arguments: any;
}

export interface FileReadBlock extends BaseBlock {
  type: "file-read";
  filePath: string;
  content: string;
}

export interface CodeSearchBlock extends BaseBlock {
  type: "code-search";
  query: string;
  results: string[];
}
