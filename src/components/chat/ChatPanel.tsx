import React, { useState, useRef, useEffect } from 'react';
import { apiClient, ProposedCommand } from '../../services/apiClient';
import { ActiveSessionConfig } from '../../types/session';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  proposedCommand?: ProposedCommand | null;
  executionStatus?: 'idle' | 'executing' | 'executed' | 'rejected' | 'failed';
}

export interface ChatPanelProps {
  activeSession?: ActiveSessionConfig | null;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ activeSession }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [readTerminal, setReadTerminal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sessionId = activeSession?.sessionId || localStorage.getItem('guardian-session-id') || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages([
      {
        id: '1',
        sender: 'ai',
        text: '¡Hola Operador! Soy el Copiloto IA de The Guardian of Kaliche. ¿Cómo puedo ayudarte hoy con tu laboratorio de seguridad?',
        timestamp: new Date().toISOString()
      }
    ]);
  }, []);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() && !readTerminal) return;

    let terminalContext = '';
    if (readTerminal && (window as any).getTerminalText) {
      terminalContext = (window as any).getTerminalText();
    }

    const finalPrompt = terminalContext 
      ? `[CONTEXTO DE TERMINAL ADJUNTO]:\n${terminalContext}\n\n[PREGUNTA DEL USUARIO]:\n${inputValue}`
      : inputValue;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue || '(Contexto de terminal enviado)',
      timestamp: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiClient.sendMessage(finalPrompt, sessionId || undefined);

      if (response.success && response.data) {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: response.data.response,
          proposedCommand: response.data.proposed_command,
          executionStatus: 'idle',
          timestamp: new Date().toISOString()
        }]);
      } else {
        setMessages((prev) => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: `Error de conexión: ${response.error?.message}`,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `Error de conexión: ${err.message}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeAction = async (msgId: string, cmd: ProposedCommand) => {
    if (!window.terminalAPI) return;
    setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, executionStatus: 'executed' } : m));
    window.terminalAPI.sendInput(cmd.text + '\n');
  };

  const rejectAction = (msgId: string) => {
    setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, executionStatus: 'rejected' } : m));
  };

  return (
    <div className="flex flex-col h-full bg-surface-container-low overflow-hidden justify-between">
      {/* Copilot Header */}
      <div className="flex items-center justify-between px-space-xl py-space-lg bg-surface-container border-b border-outline-variant">
        <div className="flex items-center gap-space-md">
          <div className="w-8 h-8 rounded-lg bg-tertiary-container/30 text-tertiary flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface font-semibold uppercase tracking-wide">Copiloto de Seguridad IA</span>
            <span className="font-label-sm text-label-sm text-tertiary">Gemini 2.5 • Razonamiento SecOps</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          ONLINE
        </span>
      </div>

      {/* Chat Conversation Area */}
      <div className="flex-1 p-space-xl overflow-y-auto space-y-space-lg">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col gap-space-sm ${msg.sender === 'user' ? 'items-end' : ''}`}>
            {msg.sender === 'ai' ? (
              <>
                <div className="flex items-center gap-space-sm text-label-sm font-label-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[15px] text-tertiary">neurology</span>
                  <span className="text-on-surface font-medium">Guardian AI</span>
                  <span className="text-outline">• {new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="bg-surface-container p-space-lg rounded-xl text-on-surface font-body-md text-body-md leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                </div>
                
                {msg.proposedCommand && msg.executionStatus === 'idle' && (
                  <div className="bg-surface-container-lowest rounded-xl p-space-lg flex flex-col gap-space-md shadow-md mt-2 border border-outline-variant">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-label-sm text-label-sm font-medium text-tertiary">
                        <span className="material-symbols-outlined text-[16px]">terminal</span>
                        COMANDO SUGERIDO
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary font-label-sm text-label-sm">
                        Risk: Analizado
                      </span>
                    </div>
                    <div className="bg-surface-container p-space-md rounded-lg font-terminal-stream text-sm text-primary select-all break-all leading-normal">
                      {msg.proposedCommand.text}
                    </div>
                    <div className="flex items-center gap-space-md pt-1">
                      <button 
                        onClick={() => executeAction(msg.id, msg.proposedCommand!)}
                        className="flex-1 bg-primary/15 hover:bg-primary text-primary hover:text-on-primary font-headline-sm text-headline-sm py-2 px-space-md rounded-lg flex items-center justify-center gap-2 transition"
                      >
                        <span className="material-symbols-outlined text-[18px]">play_circle</span>
                        USAR COMANDO
                      </button>
                      <button 
                        onClick={() => rejectAction(msg.id)}
                        className="px-space-md py-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container font-headline-sm text-headline-sm transition"
                      >
                        DISMISS
                      </button>
                    </div>
                  </div>
                )}
                {msg.executionStatus === 'executed' && (
                  <div className="text-primary font-label-sm text-label-sm flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span> Comando ejecutado
                  </div>
                )}
                {msg.executionStatus === 'rejected' && (
                  <div className="text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1 mt-1">
                    <span className="material-symbols-outlined text-[14px]">cancel</span> Comando descartado
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-1 text-label-sm font-label-sm text-on-surface-variant">
                  <span>Analista de Seguridad</span>
                </div>
                <div className="bg-surface-container-high text-on-surface font-body-md text-body-md px-space-lg py-2.5 rounded-xl rounded-tr-sm max-w-[90%]">
                  {msg.text}
                </div>
              </>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-tertiary">
            <span className="material-symbols-outlined animate-spin">refresh</span>
            <span className="font-label-sm text-label-sm uppercase tracking-wider">Analizando...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Copilot Bottom Controls */}
      <div className="bg-surface-container p-space-lg flex flex-col gap-space-md border-t border-outline-variant">
        <div className="flex items-center justify-between px-1">
          <label className="flex items-center gap-space-md cursor-pointer select-none">
            <div className="relative inline-flex items-center">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={readTerminal}
                onChange={(e) => setReadTerminal(e.target.checked)}
              />
              <div className="w-9 h-5 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface">Leer salida de la terminal</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">La IA analiza las últimas líneas de la terminal</span>
            </div>
          </label>
        </div>
        
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input 
            type="text" 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
            className="w-full bg-surface-container-lowest font-body-md text-body-md text-on-surface placeholder:text-outline rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:bg-surface-container-high transition-colors" 
            placeholder="Pregúntale a Guardian AI o solicita un comando..." 
          />
          <button 
            type="submit" 
            disabled={isLoading || (!inputValue.trim() && !readTerminal)}
            className="absolute right-2 p-2 text-primary hover:bg-surface-container rounded-md transition flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
