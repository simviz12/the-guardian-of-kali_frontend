/**
 * HTTP Client module for communicating with The Guardian of Kali FastAPI backend.
 * Base URL: http://127.0.0.1:8765
 *
 * Provides typed functions for:
 * - executeCommand(command, target, origin, sessionId)
 * - getHistory(filters)
 * - sendMessage(message, sessionId)
 * - checkHealth()
 */

export type ApiResult<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: ApiError };

export interface ApiError {
  code: 'BACKEND_OFFLINE' | 'TIMEOUT' | 'HTTP_ERROR' | 'INVALID_RESPONSE';
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

        return {
          success: false,
          error: {
            code: 'HTTP_ERROR',
            message: `Request failed with HTTP status ${response.status}`,
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
