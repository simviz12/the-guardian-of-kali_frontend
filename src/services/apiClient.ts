/**
 * HTTP Client module for communicating with The Guardian of Kali FastAPI backend.
 * Base URL: http://127.0.0.1:8765
 *
 * Provides typed functions for:
 * - executeCommand(command, target, origin, sessionId)
 * - getHistory(filters)
 * - sendMessage(message, sessionId)
 * - checkHealth()
 * - parseAppError(error)
 */
import { AppErrorDetails, FieldValidationError } from '../types/errors';

export type ApiResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: ApiError };

export interface ApiError {
  code:
    | 'BACKEND_OFFLINE'
    | 'TIMEOUT'
    | 'HTTP_ERROR'
    | 'INVALID_RESPONSE'
    | 'CLAUDE_API_FAILURE'
    | 'VALIDATION_ERROR'
    | 'WSL_UNAVAILABLE'
    | 'POLICY_VIOLATION';
  message: string;
  statusCode?: number;
  details?: unknown;
}

export interface ExecuteCommandPayload {
  command: string;
  target?: string | null;
  origin?: 'MANUAL_USER' | 'AI';
  session_id?: string | null;
}

export interface ExecuteCommandResponse {
  command: string;
  exit_code: number;
  stdout: string;
  stderr: string;
  duration_ms: number;
  session_id: string;
}

export interface CommandHistoryItem {
  text: string;
  origin: string;
  target: string | null;
  risk_level: string | null;
  timestamp: string;
  policy_decision?: string | null;
  result?: string | null;
}

export interface HistoryResponse {
  count: number;
  commands: CommandHistoryItem[];
}

export interface HistoryFilters {
  sessionId?: string;
  user?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'BLOCKED';
}

export interface ProposedCommand {
  text: string;
  target: string | null;
  origin: 'MANUAL_USER' | 'AI';
}

export interface ChatResponse {
  response: string;
  has_proposed_command: boolean;
  proposed_command: ProposedCommand | null;
  session_id: string;
}

/**
 * Intelligent error parser converting raw API/Network/Pydantic errors into
 * actionable, structured AppErrorDetails.
 */
export function parseAppError(error: ApiError | Error | unknown): AppErrorDetails {
  // If already an ApiError object
  if (error && typeof error === 'object' && 'code' in error) {
    const apiErr = error as ApiError;
    const status = apiErr.statusCode;
    const rawDetails = apiErr.details;
    const detailStr =
      typeof rawDetails === 'string'
        ? rawDetails
        : typeof rawDetails === 'object' && rawDetails !== null && 'detail' in rawDetails
        ? String((rawDetails as Record<string, unknown>).detail)
        : '';

    // 1. Backend Offline / Network Refusal
    if (apiErr.code === 'BACKEND_OFFLINE' || apiErr.code === 'TIMEOUT') {
      return {
        kind: 'BACKEND_OFFLINE',
        title: 'FastAPI Backend Offline',
        message: 'Could not connect to The Guardian of Kali backend service at 127.0.0.1:8765.',
        actionLabel: 'Retry Connection',
        actionHint: 'Start the backend via: python -m src.main (or run backend dev service).',
        statusCode: status,
        technicalDetails: apiErr.message,
      };
    }

    // 2. Pydantic 422 Unprocessable Entity Validation Errors
    if (status === 422 || apiErr.code === 'VALIDATION_ERROR') {
      const fieldErrors: FieldValidationError[] = [];
      if (
        rawDetails &&
        typeof rawDetails === 'object' &&
        'detail' in rawDetails &&
        Array.isArray((rawDetails as Record<string, unknown>).detail)
      ) {
        const rawList = (rawDetails as Record<string, unknown>).detail as Array<{
          loc?: Array<string | number>;
          msg?: string;
          type?: string;
        }>;
        for (const item of rawList) {
          const fieldName = item.loc ? item.loc.filter((x) => x !== 'body').join('.') : 'payload';
          fieldErrors.push({
            field: fieldName || 'field',
            message: item.msg || 'Invalid field constraint',
            type: item.type,
          });
        }
      }

      const formattedFields = fieldErrors.length
        ? fieldErrors.map((f) => `\`${f.field}\`: ${f.message}`).join(', ')
        : 'Request data failed Pydantic schema validation.';

      return {
        kind: 'VALIDATION_ERROR',
        title: 'Input Validation Failed',
        message: `Pydantic schema validation rejected the payload: ${formattedFields}`,
        actionLabel: 'Correct Input',
        actionHint: 'Check field formats, required non-empty values, and UUID syntax.',
        statusCode: 422,
        fieldErrors,
        technicalDetails: JSON.stringify(rawDetails, null, 2),
      };
    }

    // 3. Claude AI API Failures (429 Rate Limits, 502 Bad Gateway, 503 Service Unavailable)
    if (
      status === 429 ||
      status === 502 ||
      status === 503 ||
      detailStr.toLowerCase().includes('claude') ||
      detailStr.toLowerCase().includes('anthropic') ||
      detailStr.toLowerCase().includes('rate limit')
    ) {
      const isRateLimit = status === 429 || detailStr.toLowerCase().includes('rate limit');
      return {
        kind: 'CLAUDE_API_FAILURE',
        title: isRateLimit ? 'Claude AI Rate Limit Exceeded' : 'Claude AI Service Unavailable',
        message: detailStr || apiErr.message,
        actionLabel: isRateLimit ? 'Wait & Retry' : 'Retry Request',
        actionHint: isRateLimit
          ? 'Anthropic API rate limit exceeded. Please wait 15-30 seconds before sending another message.'
          : 'Check your ANTHROPIC_API_KEY environment variable and Anthropic API status.',
        statusCode: status,
        technicalDetails: JSON.stringify(rawDetails || apiErr.message, null, 2),
      };
    }

    // 4. Zero-Trust Policy Engine Violations (403 Forbidden)
    if (status === 403 || detailStr.toLowerCase().includes('blocked') || detailStr.toLowerCase().includes('not authorized')) {
      return {
        kind: 'POLICY_VIOLATION',
        title: 'Zero-Trust Security Policy Blocked',
        message: detailStr || 'Command was blocked by the security policy engine.',
        actionLabel: 'Review Scope',
        actionHint: 'Target is outside authorized scope or command matches a destructive blacklist rule.',
        statusCode: 403,
        technicalDetails: detailStr,
      };
    }

    // 5. WSL Subprocess Failures
    if (
      detailStr.toLowerCase().includes('wsl') ||
      detailStr.toLowerCase().includes('kali-linux') ||
      detailStr.toLowerCase().includes('distro')
    ) {
      return {
        kind: 'WSL_UNAVAILABLE',
        title: 'Kali Linux WSL2 Unavailable',
        message: detailStr || 'Failed to interact with Kali Linux on WSL2.',
        actionLabel: 'Verify WSL2',
        actionHint: 'Open PowerShell as Administrator and run: wsl -l -v or wsl --install -d kali-linux.',
        statusCode: status,
        technicalDetails: detailStr,
      };
    }

    // Generic HTTP error fallback
    return {
      kind: 'UNKNOWN_ERROR',
      title: `Server Error (${status || 'Unknown'})`,
      message: detailStr || apiErr.message,
      actionLabel: 'Retry',
      actionHint: 'Check backend server logs for detailed traceback.',
      statusCode: status,
      technicalDetails: JSON.stringify(rawDetails || apiErr.message, null, 2),
    };
  }

  // Error instance fallback
  if (error instanceof Error) {
    const isOffline = error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
    return {
      kind: isOffline ? 'BACKEND_OFFLINE' : 'UNKNOWN_ERROR',
      title: isOffline ? 'Backend Service Unreachable' : 'Application Runtime Error',
      message: error.message,
      actionLabel: 'Retry',
      actionHint: isOffline
        ? 'Verify that FastAPI backend is listening on http://127.0.0.1:8765.'
        : 'Check browser developer tools console for stack trace.',
      technicalDetails: error.stack,
    };
  }

  return {
    kind: 'UNKNOWN_ERROR',
    title: 'Unexpected System Error',
    message: String(error) || 'An unknown error occurred.',
    actionLabel: 'Retry',
  };
}

export class BackendApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(baseUrl: string = 'http://127.0.0.1:8765', timeoutMs: number = 30000) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.timeoutMs = timeoutMs;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResult<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });

      clearTimeout(timer);

      if (!response.ok) {
        let details: unknown = null;
        try {
          details = await response.json();
        } catch {
          details = await response.text();
        }

        let code: ApiError['code'] = 'HTTP_ERROR';
        if (response.status === 422) {
          code = 'VALIDATION_ERROR';
        } else if (response.status === 429 || response.status === 502 || response.status === 503) {
          code = 'CLAUDE_API_FAILURE';
        } else if (response.status === 403) {
          code = 'POLICY_VIOLATION';
        }

        const detailMsg =
          typeof details === 'object' && details !== null && 'detail' in details
            ? String((details as Record<string, unknown>).detail)
            : `Request failed with HTTP status ${response.status}`;

        return {
          success: false,
          error: {
            code,
            message: detailMsg,
            statusCode: response.status,
            details,
          },
        };
      }

      const data = (await response.json()) as T;
      return { success: true, data };
    } catch (err: unknown) {
      clearTimeout(timer);

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          return {
            success: false,
            error: {
              code: 'TIMEOUT',
              message: `Request to ${url} timed out after ${this.timeoutMs}ms`,
            },
          };
        }

        return {
          success: false,
          error: {
            code: 'BACKEND_OFFLINE',
            message: `Could not connect to backend at ${this.baseUrl}: ${err.message}`,
            details: err,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'BACKEND_OFFLINE',
          message: 'An unknown network error occurred',
          details: err,
        },
      };
    }
  }

  async executeCommand(
    command: string,
    target?: string | null,
    origin: 'MANUAL_USER' | 'AI' = 'AI',
    sessionId?: string | null
  ): Promise<ApiResult<ExecuteCommandResponse>> {
    const payload: ExecuteCommandPayload = {
      command,
      target: target ?? null,
      origin,
      session_id: sessionId ?? null,
    };

    return this.request<ExecuteCommandResponse>('/execute', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getHistory(filters: HistoryFilters = {}): Promise<ApiResult<HistoryResponse>> {
    const queryParams = new URLSearchParams();

    if (filters.sessionId) queryParams.append('session_id', filters.sessionId);
    if (filters.user) queryParams.append('user', filters.user);
    if (filters.riskLevel) queryParams.append('risk_level', filters.riskLevel);
    if (filters.startDate) {
      const startStr =
        filters.startDate instanceof Date ? filters.startDate.toISOString() : filters.startDate;
      queryParams.append('start_date', startStr);
    }
    if (filters.endDate) {
      const endStr =
        filters.endDate instanceof Date ? filters.endDate.toISOString() : filters.endDate;
      queryParams.append('end_date', endStr);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/history?${queryString}` : '/history';

    return this.request<HistoryResponse>(endpoint, {
      method: 'GET',
    });
  }

  async sendMessage(
    message: string,
    sessionId?: string | null
  ): Promise<ApiResult<ChatResponse>> {
    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        session_id: sessionId ?? null,
      }),
    });
  }

  async checkHealth(): Promise<ApiResult<{ status: string; service: string; version: string }>> {
    return this.request<{ status: string; service: string; version: string }>('/health', {
      method: 'GET',
    });
  }
}

export const apiClient = new BackendApiClient();
