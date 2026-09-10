/**
 * Client service to communicate with the FastAPI backend policy engine.
 */
export interface CommandEvaluationRequest {
  command: string;
  context?: Record<string, unknown>;
}

export async function evaluateCommand(request: CommandEvaluationRequest) {
  // Placeholder for HTTP client to backend
  return { status: 'safe', allowed: true, evaluatedCommand: request.command };
}
