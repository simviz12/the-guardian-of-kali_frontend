/**
 * Global application error domain types and classification models.
 */

export type AppErrorKind =
  | 'WSL_UNAVAILABLE'
  | 'CLAUDE_API_FAILURE'
  | 'BACKEND_OFFLINE'
  | 'VALIDATION_ERROR'
  | 'POLICY_VIOLATION'
  | 'UNKNOWN_ERROR';

export interface FieldValidationError {
  field: string;
  message: string;
  type?: string;
}

export interface AppErrorDetails {
  kind: AppErrorKind;
  title: string;
  message: string;
  actionLabel?: string;
  actionHint?: string;
  statusCode?: number;
  fieldErrors?: FieldValidationError[];
  technicalDetails?: string;
}
