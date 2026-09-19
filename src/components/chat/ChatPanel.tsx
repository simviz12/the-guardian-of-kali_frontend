/**
 * Chat panel component for conversational interaction with the AI assistant.
 * Displays message history (User / AI), text input form, distinct cards
 * for proposed commands with Execute/Reject actions, and actionable global error alerts.
 */
import React, { useState, useRef, useEffect } from 'react';
import { apiClient, ProposedCommand, parseAppError } from '../../services/apiClient';
import { PolicyIndicator } from '../policy/PolicyIndicator';
import { GlobalErrorBanner } from '../common/GlobalErrorBanner';
import { ActiveSessionConfig } from '../../types/session';
import { AppErrorDetails } from '../../types/errors';

export interface ChatMessage {
  id: string;
  dbId?: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  proposedCommand?: ProposedCommand | null;
  executionStatus?: 'idle' | 'executing' | 'executed' | 'rejected' | 'failed';
  executionResult?: {
    stdout: string;
    stderr: string;
    exitCode: number;
  };
  errorDetails?: AppErrorDetails;
}

export interface ChatPanelProps {
  activeSession?: ActiveSessionConfig | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ activeSession }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(
    () => activeSession?.sessionId || localStorage.getItem('guardian-session-id') || null
  );
  const [activeError, setActiveError] = useState<AppErrorDetails | null>(null);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persist sessionId to localStorage whenever it changes
  useEffect(() => {
    if (activeSession?.sessionId) {
      setSessionId(activeSession.sessionId);
      localStorage.setItem('guardian-session-id', activeSession.sessionId);
    }
  }, [activeSession?.sessionId]);

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('guardian-session-id', sessionId);
    }
  }, [sessionId]);

  // Load chat history from backend on mount
  useEffect(() => {
    const loadHistory = async () => {
      const sid = activeSession?.sessionId || localStorage.getItem('guardian-session-id');
      if (!sid) {
        // No session yet — show welcome
        setMessages([{
          id: 'welcome',
          sender: 'ai',
          text: '¡Hola Operador! Soy The Guardian of Kali. ¿En qué puedo ayudarte hoy con tu laboratorio o desafío de ciberseguridad / CTF?',
          timestamp: new Date().toLocaleTimeString(),
        }]);
        return;
      }

      const result = await apiClient.getChatMessages(sid);
      if (result.success && result.data.messages.length > 0) {
        const loaded: ChatMessage[] = result.data.messages.map((m) => ({
          id: `db-${m.id}`,
          dbId: m.id,
          sender: m.sender as 'user' | 'ai',
          text: m.text,
          timestamp: new Date(m.timestamp).toLocaleTimeString(),
          proposedCommand: m.proposed_command_text
            ? { text: m.proposed_command_text, target: m.proposed_command_target, origin: 'AI' as const }
            : null,
          executionStatus: (m.execution_status as ChatMessage['executionStatus']) || undefined,
          executionResult: m.execution_stdout != null
            ? { stdout: m.execution_stdout || '', stderr: m.execution_stderr || '', exitCode: m.execution_exit_code ?? 0 }
            : undefined,
        }));
        setMessages(loaded);
      } else {
        setMessages([{
          id: 'welcome',
          sender: 'ai',
          text: '¡Hola Operador! Soy The Guardian of Kali. ¿En qué puedo ayudarte hoy con tu laboratorio o desafío de ciberseguridad / CTF?',
          timestamp: new Date().toLocaleTimeString(),
        }]);
      }
    };

    loadHistory();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeError]);

  const handleSendMessage = async (e?: React.FormEvent, retryPrompt?: string) => {
    if (e) e.preventDefault();
    const promptToSend = (retryPrompt || inputValue).trim();
    if (!promptToSend || isLoading) return;

    if (!retryPrompt) {
      const userMessageId = `msg-${Date.now()}`;
      const userMessage: ChatMessage = {
        id: userMessageId,
        sender: 'user',
        text: promptToSend,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputValue('');
    }

    setLastUserPrompt(promptToSend);
    setActiveError(null);
    setIsLoading(true);

    const currentSessionId = sessionId;
    const targetsList = activeSession?.authorizedTargets?.map((t) => t.value) || [];

    // Save user message to DB
    if (!retryPrompt && currentSessionId) {
      apiClient.saveChatMessage({
        session_id: currentSessionId,
        sender: 'user',
        text: promptToSend,
        timestamp: new Date().toISOString(),
      });
    }

    const result = await apiClient.sendMessage(
      promptToSend,
      sessionId,
      targetsList,
      activeSession?.operationMode || 'suggestion'
    );

    setIsLoading(false);

    if (result.success) {
      const data = result.data;
      const activeSessionId = data.session_id || currentSessionId;
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      const msgId = `ai-${Date.now()}`;
      const isLowRisk =
        data.proposed_command &&
        !data.proposed_command.text.includes('rm -rf') &&
        !data.proposed_command.text.includes('mkfs') &&
        !data.proposed_command.text.includes('-A') &&
        !data.proposed_command.text.includes('-sV');

      const isAutonomous = activeSession?.operationMode === 'autonomous';

      const aiMessage: ChatMessage = {
        id: msgId,
        sender: 'ai',
        text: data.response,
        timestamp: new Date().toLocaleTimeString(),
        proposedCommand: data.has_proposed_command ? data.proposed_command : null,
        executionStatus: data.has_proposed_command
          ? isAutonomous && isLowRisk
            ? 'executing'
            : 'idle'
          : undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Save AI message to DB
      if (activeSessionId) {
        apiClient.saveChatMessage({
          session_id: activeSessionId,
          sender: 'ai',
          text: data.response,
          proposed_command_text: data.proposed_command?.text ?? null,
          proposed_command_target: data.proposed_command?.target ?? null,
          execution_status: data.has_proposed_command ? (isAutonomous && isLowRisk ? 'executing' : 'idle') : null,
          timestamp: new Date().toISOString(),
        }).then((saveResult) => {
          if (saveResult.success) {
            // Attach dbId to the AI message so we can update it after execution
            setMessages((prev) =>
              prev.map((m) => m.id === msgId ? { ...m, dbId: saveResult.data.message_id } : m)
            );
          }
        });
      }

      // Auto-execute LOW risk in autonomous mode
      if (data.has_proposed_command && data.proposed_command && isAutonomous && isLowRisk) {
        handleExecuteCommand(msgId, data.proposed_command);
      }
    } else {
      const parsedError = parseAppError(result.error);
      setActiveError(parsedError);

      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `⚠️ [${parsedError.title}]: ${parsedError.message}`,
        timestamp: new Date().toLocaleTimeString(),
        errorDetails: parsedError,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };


  const handleExecuteCommand = async (msgId: string, cmd: ProposedCommand) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, executionStatus: 'executing' } : msg
      )
    );

    if (window.terminalAPI && (window as any).terminalAPI.writeOutput) {
      (window as any).terminalAPI.writeOutput(`\r\n\x1b[1;36m[Guardian AI]\x1b[0m Ejecutando tarea en background: \x1b[33m${cmd.text}\x1b[0m\r\n`);
    }

    const result = await apiClient.executeCommand(cmd.text, cmd.target, 'AI', sessionId);
    if (result.success) {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== msgId) return msg;
          return {
            ...msg,
            executionStatus: 'executed',
            executionResult: {
              stdout: result.data.stdout,
              stderr: result.data.stderr,
              exitCode: result.data.exit_code,
            },
          };
        })
      );

      if (window.terminalAPI && (window as any).terminalAPI.writeOutput) {
        let terminalOut = result.data.stdout.replace(/\n/g, '\r\n');
        if (result.data.stderr) {
           terminalOut += `\x1b[31m${result.data.stderr.replace(/\n/g, '\r\n')}\x1b[0m`;
        }
        (window as any).terminalAPI.writeOutput(`\x1b[1;32m[OK]\x1b[0m Tarea completada con código ${result.data.exit_code}\r\n${terminalOut}\r\n`);
      }

      // Persist execution result to DB if we have dbId
      const msgWithDb = messages.find((m) => m.id === msgId);
      if (msgWithDb?.dbId) {
        apiClient.updateChatMessage(msgWithDb.dbId, {
          execution_status: 'executed',
          execution_stdout: result.data.stdout,
          execution_stderr: result.data.stderr,
          execution_exit_code: result.data.exit_code,
        });
      }

      // Automáticamente pedirle a la IA que analice el resultado
      const analysisPrompt = `He ejecutado el comando '${cmd.text}'.\nCódigo de salida: ${result.data.exit_code}\n\nSalida:\n${result.data.stdout || '(sin salida)'}\n\nPor favor, analiza este resultado y dime qué significa o cuáles son los siguientes pasos.`;
      handleSendMessage(undefined, analysisPrompt);

    } else {
      const parsedError = parseAppError(result.error);
      setActiveError(parsedError);
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== msgId) return msg;
          return {
            ...msg,
            executionStatus: 'failed',
            executionResult: {
              stdout: '',
              stderr: parsedError.message,
              exitCode: result.error.statusCode || 1,
            },
            errorDetails: parsedError,
          };
        })
      );

      if (window.terminalAPI && (window as any).terminalAPI.writeOutput) {
        (window as any).terminalAPI.writeOutput(`\x1b[1;31m[ERROR]\x1b[0m La tarea falló: ${parsedError.message}\r\n`);
      }
    }
  };

  const handleRejectCommand = (msgId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, executionStatus: 'rejected' } : msg
      )
    );
  };

  return (
    <div className="flex h-full w-[430px] lg:w-[480px] flex-col border-l border-zinc-800 bg-zinc-950 text-white">
      {/* Panel Header */}
      <div className="border-b border-zinc-800 px-5 py-3.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <h2 className="text-base font-bold tracking-wide text-zinc-100">Guardian AI Co-pilot</h2>
          </div>
          <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-mono text-emerald-400 border border-emerald-500/30 font-bold">Gemini 2.5</span>
        </div>

        {/* Active Session Scope & Mode Bar */}
        {activeSession && (
          <div className="flex items-center justify-between pt-1 text-[10px] font-mono text-zinc-400 border-t border-zinc-800/60">
            <span
              className={
                activeSession.operationMode === 'autonomous'
                  ? 'text-amber-400 font-bold'
                  : 'text-emerald-400 font-bold'
              }
            >
              Mode: {activeSession.operationMode.toUpperCase()}
            </span>
            <span>
              Scope: {activeSession.authorizedTargets.length} target{activeSession.authorizedTargets.length === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : msg.errorDetails
                  ? 'bg-zinc-900 border border-red-500/40 text-red-200'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>

            {/* Proposed Command Card */}
            {msg.proposedCommand && (
              <div className="mt-2.5 w-full max-w-[90%] rounded-lg border border-amber-500/40 bg-zinc-900/90 p-3 shadow-lg">
                <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
                  <div className="flex items-center space-x-2">
                    <span>ACCIÓN PROPUESTA</span>
                    <PolicyIndicator
                      riskLevel={
                        msg.proposedCommand.text.includes('rm -rf') || msg.proposedCommand.text.includes('mkfs')
                          ? 'BLOCKED'
                          : msg.proposedCommand.text.includes('-A') || msg.proposedCommand.text.includes('-sV')
                          ? 'MEDIUM'
                          : 'LOW'
                      }
                      action={
                        msg.proposedCommand.text.includes('rm -rf') || msg.proposedCommand.text.includes('mkfs')
                          ? 'BLOCK'
                          : msg.proposedCommand.text.includes('-A') || msg.proposedCommand.text.includes('-sV')
                          ? 'REQUIRE_CONFIRMATION'
                          : 'AUTO_EXECUTE'
                      }
                      reason={
                        msg.proposedCommand.text.includes('rm -rf')
                          ? 'Bloqueado por regla de lista negra destructiva: eliminación masiva recursiva'
                          : msg.proposedCommand.text.includes('-A') || msg.proposedCommand.text.includes('-sV')
                          ? 'Escaneo de versiones agresivo: requiere confirmación del operador'
                          : 'Comando estándar no destructivo autorizado bajo el motor de políticas.'
                      }
                      size="sm"
                    />
                  </div>
                  {msg.proposedCommand.target && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px]">
                      Objetivo: {msg.proposedCommand.target}
                    </span>
                  )}
                </div>

                <div className="mt-2 rounded bg-black/80 p-2 font-mono text-xs text-emerald-400 border border-zinc-800 overflow-x-auto">
                  <code>$ {msg.proposedCommand.text}</code>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-end space-x-2">
                  {msg.executionStatus === 'idle' && (
                    <>
                      <button
                        onClick={() => handleRejectCommand(msg.id)}
                        className="rounded bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleExecuteCommand(msg.id, msg.proposedCommand!)}
                        className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 transition shadow"
                      >
                        Ejecutar
                      </button>
                    </>
                  )}

                  {msg.executionStatus === 'executing' && (
                    <span className="text-xs text-amber-400 animate-pulse font-medium">
                      Ejecutando en WSL2 (ia-user)...
                    </span>
                  )}

                  {msg.executionStatus === 'executed' && (
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400 font-medium">
                      ✓ Ejecutado (Código: {msg.executionResult?.exitCode})
                    </span>
                  )}

                  {msg.executionStatus === 'rejected' && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                      ✕ Rechazado por el Operador
                    </span>
                  )}

                  {msg.executionStatus === 'failed' && (
                    <span className="rounded bg-rose-500/20 px-2 py-0.5 text-xs text-rose-400 font-medium">
                      ⚠ Falló la Ejecución
                    </span>
                  )}
                </div>

                {/* Optional stdout snippet if executed */}
                {msg.executionResult && msg.executionResult.stdout && (
                  <div className="mt-2 max-h-24 overflow-y-auto rounded bg-zinc-950 p-1.5 font-mono text-[11px] text-zinc-400 border border-zinc-800">
                    <pre>{msg.executionResult.stdout}</pre>
                  </div>
                )}
              </div>
            )}

            <span className="mt-1 text-[10px] text-zinc-500">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center space-x-2 text-zinc-500 text-xs">
            <div className="h-2 w-2 rounded-full bg-zinc-500 animate-ping" />
            <span>Guardian está analizando...</span>
          </div>
        )}

        {/* Global Error Alert Banner inside Chat */}
        {activeError && (
          <div className="mt-2">
            <GlobalErrorBanner
              error={activeError}
              onRetry={
                lastUserPrompt
                  ? () => handleSendMessage(undefined, lastUserPrompt)
                  : undefined
              }
              onDismiss={() => setActiveError(null)}
            />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="border-t border-zinc-800 p-4 bg-zinc-900/50">
        <div className="flex space-x-2.5">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Pregunta a Guardian (ej. ¿Cómo escanear puertos?)..."
            disabled={isLoading}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm md:text-base text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 transition font-sans"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm md:text-base font-bold text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-md active:scale-95 cursor-pointer"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
