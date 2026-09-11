/**
 * Session configuration domain types.
 */

export type OperationMode = 'suggestion' | 'autonomous';

export interface AuthorizedTargetConfig {
  value: string;
  description?: string;
}

export interface ActiveSessionConfig {
  sessionId: string;
  user: string;
  operationMode: OperationMode;
  authorizedTargets: AuthorizedTargetConfig[];
  startedAt: string;
}
