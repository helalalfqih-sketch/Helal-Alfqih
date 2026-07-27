/**
 * Phase 6.1 — Interaction & Sequence Recorder
 * Records user click & form interaction sequences for journey debugging
 */

export interface RecordedInteractionStep {
  id: string;
  action: "CLICK" | "FORM_SUBMIT" | "NAVIGATION" | "MEDIA_UPLOAD";
  targetElement: string;
  routePath: string;
  status: "SUCCESS" | "FAILED";
  durationMs: number;
  timestamp: string;
}

const interactionSequenceBuffer: RecordedInteractionStep[] = [];

export function recordInteraction(step: Omit<RecordedInteractionStep, "id" | "timestamp">) {
  interactionSequenceBuffer.push({
    ...step,
    id: `SEQ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  });
  if (interactionSequenceBuffer.length > 50) interactionSequenceBuffer.shift();
}

export function getInteractionSequenceHistory(): RecordedInteractionStep[] {
  return [...interactionSequenceBuffer];
}
