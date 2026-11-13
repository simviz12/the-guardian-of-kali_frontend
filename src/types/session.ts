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
  /** Allowed ports as typed by the operator (e.g. "80, 443, 8080-8090"); empty = no limit. */
  allowedPorts?: string;
  startedAt: string;
}
