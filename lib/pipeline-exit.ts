export type StepOutcome = {
  candidates: number;
  succeeded: number;
  failed: number;
};

/**
 * Decide the process exit code for a batch pipeline step.
 *
 * Returns 1 (failure) only when there was work to do and none of it
 * succeeded, so the orchestrator records a genuinely failed run instead of a
 * false success. Returns 0 when there were no candidates, or when at least one
 * item succeeded -- partial failures are surfaced by the step's summary log and
 * per-row retry/DLQ state, not by the exit code.
 */
export function decideExitCode({ candidates, succeeded, failed }: StepOutcome): 0 | 1 {
  if (candidates === 0) {
    return 0;
  }

  if (succeeded === 0 && failed > 0) {
    return 1;
  }

  return 0;
}
