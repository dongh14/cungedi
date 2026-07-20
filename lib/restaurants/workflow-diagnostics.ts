import { sanitizeSourceHostname } from "./deepseek-diagnostics.ts";

export type WorkflowDiagnosticEvent =
  | "intake_started"
  | "source_detected"
  | "extraction_completed"
  | "ai_completed"
  | "review_ready"
  | "suggestion_applied"
  | "save_failed"
  | "source_post_save_failed";

type WorkflowDiagnosticInput = {
  event: WorkflowDiagnosticEvent;
  sourceUrls?: string[];
  sourceType?: string;
  extractionStatus?: string;
  aiStatus?: string;
  durationMs?: number;
  suggestionCount?: number;
  operation?: string;
  errorCategory?: string;
  errorCode?: string;
};

function sanitizeWorkflowPayload(input: WorkflowDiagnosticInput) {
  return {
    event: input.event,
    ...(input.sourceUrls
      ? { sourceHosts: Array.from(new Set(input.sourceUrls.map(sanitizeSourceHostname))) }
      : {}),
    ...(input.sourceType ? { sourceType: input.sourceType } : {}),
    ...(input.extractionStatus ? { extractionStatus: input.extractionStatus } : {}),
    ...(input.aiStatus ? { aiStatus: input.aiStatus } : {}),
    ...(typeof input.durationMs === "number" ? { durationMs: input.durationMs } : {}),
    ...(typeof input.suggestionCount === "number" ? { suggestionCount: input.suggestionCount } : {}),
    ...(input.operation ? { operation: input.operation } : {}),
    ...(input.errorCategory ? { errorCategory: input.errorCategory } : {}),
    ...(input.errorCode ? { errorCode: input.errorCode } : {}),
  };
}

export function logWorkflowDiagnostic(
  input: WorkflowDiagnosticInput,
  env: NodeJS.ProcessEnv = process.env,
) {
  if (env.NODE_ENV !== "development" || env.WORKFLOW_DEBUG_LOGS === "false") {
    return;
  }

  console.debug(`[workflow] ${input.event}`, sanitizeWorkflowPayload(input));
}
