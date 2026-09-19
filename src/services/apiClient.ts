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
        title: 'Backend FastAPI Desconectado',
        message: 'No se pudo conectar con el servicio backend de The Guardian of Kali en 127.0.0.1:8765.',
        actionLabel: 'Reintentar Conexión',
        actionHint: 'Inicia el backend ejecutando: python -m src.main (o verifica el servicio).',
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
            field: fieldName || 'campo',
            message: item.msg || 'Restricción de campo inválida',
            type: item.type,
          });
        }
      }

      const formattedFields = fieldErrors.length
        ? fieldErrors.map((f) => `\`${f.field}\`: ${f.message}`).join(', ')
        : 'Los datos enviados no pasaron la validación del esquema.';

      return {
        kind: 'VALIDATION_ERROR',
        title: 'Error de Validación de Entrada',
        message: `La validación rechazó los datos: ${formattedFields}`,
        actionLabel: 'Corregir Entrada',
        actionHint: 'Verifica los formatos, campos obligatorios y sintaxis de UUID.',
        statusCode: 422,
        fieldErrors,
        technicalDetails: JSON.stringify(rawDetails, null, 2),
      };
    }

    // 3. AI API Failures (429 Rate Limits, 502 Bad Gateway, 503 Service Unavailable)
    if (
      status === 429 ||
      status === 502 ||
      status === 503 ||
      detailStr.toLowerCase().includes('claude') ||
      detailStr.toLowerCase().includes('anthropic') ||
      detailStr.toLowerCase().includes('gemini') ||
      detailStr.toLowerCase().includes('rate limit')
    ) {
      const isRateLimit = status === 429 || detailStr.toLowerCase().includes('rate limit');
      return {
        kind: 'CLAUDE_API_FAILURE',
        title: isRateLimit ? 'Límite de Peticiones de IA Excedido' : 'Servicio de IA No Disponible',
        message: detailStr || apiErr.message,
        actionLabel: isRateLimit ? 'Esperar y Reintentar' : 'Reintentar Petición',
        actionHint: isRateLimit
          ? 'Límite de tasa alcanzado. Espera 15-30 segundos antes de enviar otro mensaje.'
          : 'Verifica tu API Key configurada y el estado del servicio de IA.',
        statusCode: status,
        technicalDetails: JSON.stringify(rawDetails || apiErr.message, null, 2),
      };
    }

    // 4. Zero-Trust Policy Engine Violations (403 Forbidden)
    if (status === 403 || detailStr.toLowerCase().includes('blocked') || detailStr.toLowerCase().includes('not authorized')) {
      return {
        kind: 'POLICY_VIOLATION',
        title: 'Bloqueado por Política de Seguridad Zero-Trust',
        message: detailStr || 'El comando fue bloqueado por el motor de políticas de seguridad.',
        actionLabel: 'Revisar Alcance (Scope)',
        actionHint: 'El objetivo está fuera del alcance autorizado o el comando coincide con una regla destructiva de la lista negra.',
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
        title: 'Kali Linux WSL2 No Disponible',
        message: detailStr || 'Error al interactuar con Kali Linux en WSL2.',
        actionLabel: 'Verificar WSL2',
        actionHint: 'Abre PowerShell como Administrador y ejecuta: wsl -l -v o wsl --install -d kali-linux.',
        statusCode: status,
        technicalDetails: detailStr,
      };
    }

    // Generic HTTP error fallback
    return {
      kind: 'UNKNOWN_ERROR',
      title: `Error del Servidor (${status || 'Desconocido'})`,
      message: detailStr || apiErr.message,
      actionLabel: 'Reintentar',
      actionHint: 'Revisa los registros del servidor backend para ver el error detallado.',
      statusCode: status,
      technicalDetails: JSON.stringify(rawDetails || apiErr.message, null, 2),
    };
  }

  // Error instance fallback
  if (error instanceof Error) {
    const isOffline = error.message.includes('Failed to fetch') || error.message.includes('NetworkError');
    return {
      kind: isOffline ? 'BACKEND_OFFLINE' : 'UNKNOWN_ERROR',
      title: isOffline ? 'Servicio Backend No Accesible' : 'Error de Ejecución de la Aplicación',
      message: error.message,
      actionLabel: 'Reintentar',
      actionHint: isOffline
        ? 'Verifica que el backend de FastAPI esté escuchando en http://127.0.0.1:8765.'
        : 'Revisa la consola del navegador para ver la traza del error.',
      technicalDetails: error.stack,
    };
  }

  return {
    kind: 'UNKNOWN_ERROR',
    title: 'Error Inesperado del Sistema',
    message: String(error) || 'Ocurrió un error desconocido.',
    actionLabel: 'Reintentar',
  };
}

export class BackendApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(baseUrl: string = 'http://127.0.0.1:8765', timeoutMs: number = 185000) {
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
    sessionId?: string | null,
    authorizedTargets?: string[] | null,
    operationMode?: string | null
  ): Promise<ApiResult<ChatResponse>> {
    return this.request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        session_id: sessionId ?? null,
        authorized_targets: authorizedTargets ?? null,
        operation_mode: operationMode ?? null,
      }),
    });
  }

  async checkHealth(): Promise<ApiResult<{ status: string; service: string; version: string }>> {
    return this.request<{ status: string; service: string; version: string }>('/health', {
      method: 'GET',
    });
  }

  async saveChatMessage(payload: {
    session_id: string;
    sender: 'user' | 'ai';
    text: string;
    proposed_command_text?: string | null;
    proposed_command_target?: string | null;
    execution_status?: string | null;
    execution_stdout?: string | null;
    execution_stderr?: string | null;
    execution_exit_code?: number | null;
    timestamp?: string | null;
  }): Promise<ApiResult<{ message_id: number; ok: boolean }>> {
    return this.request<{ message_id: number; ok: boolean }>('/chat/message', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateChatMessage(
    messageId: number,
    payload: {
      execution_status: string;
      execution_stdout: string;
      execution_stderr: string;
      execution_exit_code: number;
    }
  ): Promise<ApiResult<{ ok: boolean; message_id: number }>> {
    return this.request<{ ok: boolean; message_id: number }>(`/chat/message/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async getChatMessages(sessionId: string): Promise<ApiResult<{
    session_id: string;
    count: number;
    messages: Array<{
      id: number;
      session_id: string;
      sender: string;
      text: string;
      proposed_command_text: string | null;
      proposed_command_target: string | null;
      execution_status: string | null;
      execution_stdout: string | null;
      execution_stderr: string | null;
      execution_exit_code: number | null;
      timestamp: string;
    }>;
  }>> {
    return this.request(`/chat/messages/${sessionId}`, { method: 'GET' });
  }
}

export const apiClient = new BackendApiClient();
