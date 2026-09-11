/**
 * Chat panel component for conversational interaction with the AI assistant.
 * Displays message history (User / AI), text input form, and distinct cards
 * for proposed commands with Execute (POST /execute with origin='AI') and Reject actions.
 */
import React, { useState, useRef, useEffect } from 'react';
import { apiClient, ProposedCommand } from '../../services/apiClient';
import { PolicyIndicator } from '../policy/PolicyIndicator';

export interface ChatMessage {

  id: string;
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
}

export const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello Operator! I am The Guardian of Kali. How can I assist with your ethical hacking or CTF challenge today?',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    const userMessageId = `msg-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const result = await apiClient.sendMessage(trimmed, sessionId);

    setIsLoading(false);

    if (result.success) {
      const data = result.data;
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.response,
        timestamp: new Date().toLocaleTimeString(),
        proposedCommand: data.has_proposed_command ? data.proposed_command : null,
        executionStatus: data.has_proposed_command ? 'idle' : undefined,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } else {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `Error: ${result.error.message}`,
        timestamp: new Date().toLocaleTimeString(),
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

    const result = await apiClient.executeCommand(cmd.text, cmd.target, 'AI', sessionId);

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== msgId) return msg;
        if (result.success) {
          return {
            ...msg,
            executionStatus: 'executed',
            executionResult: {
              stdout: result.data.stdout,
              stderr: result.data.stderr,
              exitCode: result.data.exit_code,
            },
          };
        } else {
          return {
            ...msg,
            executionStatus: 'failed',
            executionResult: {
              stdout: '',
              stderr: result.error.message,
              exitCode: result.error.statusCode || 1,
            },
          };
        }
      })
    );
  };

  const handleRejectCommand = (msgId: string) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === msgId ? { ...msg, executionStatus: 'rejected' } : msg
      )
    );
  };

  return (
    <div className="flex h-full w-96 flex-col border-l border-zinc-800 bg-zinc-950 text-white">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center space-x-2">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-semibold tracking-wide text-zinc-100">Guardian AI Co-pilot</h2>
        </div>
        <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">Claude 3.5</span>
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
                    <span>PROPOSED ACTION</span>
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
                          ? "Blocked by destructive blacklist rule: recursive mass deletion"
                          : msg.proposedCommand.text.includes('-A') || msg.proposedCommand.text.includes('-sV')
                          ? "Aggressive service version scanning: requires operator confirmation"
                          : "Standard non-destructive command authorized under policy engine."
                      }
                      size="sm"
                    />
                  </div>
                  {msg.proposedCommand.target && (
                    <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px]">
                      Target: {msg.proposedCommand.target}
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
                        Reject
                      </button>
                      <button
                        onClick={() => handleExecuteCommand(msg.id, msg.proposedCommand!)}
                        className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 transition shadow"
                      >
                        Execute
                      </button>
                    </>
                  )}

                  {msg.executionStatus === 'executing' && (
                    <span className="text-xs text-amber-400 animate-pulse font-medium">
                      Executing in WSL2 (ia-user)...
                    </span>
                  )}

                  {msg.executionStatus === 'executed' && (
                    <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400 font-medium">
                      ✓ Executed (Exit: {msg.executionResult?.exitCode})
                    </span>
                  )}

                  {msg.executionStatus === 'rejected' && (
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">
                      ✕ Rejected by Operator
                    </span>
                  )}

                  {msg.executionStatus === 'failed' && (
                    <span className="rounded bg-rose-500/20 px-2 py-0.5 text-xs text-rose-400 font-medium">
                      ⚠ Execution Failed
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
            <span>Guardian is analyzing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="border-t border-zinc-800 p-3">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask Guardian (e.g. How to scan ports?)..."
            disabled={isLoading}
            className="flex-1 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="rounded-md bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatPanel;
