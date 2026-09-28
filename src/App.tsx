import React, { useState, useEffect, useCallback } from 'react';
import { TerminalView } from './components/terminal/TerminalView';
import { ChatPanel } from './components/chat/ChatPanel';
import { SessionHistory } from './components/history/SessionHistory';
import { SessionSetup } from './components/session/SessionSetup';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { GlobalErrorBanner } from './components/common/GlobalErrorBanner';
import { apiClient, parseAppError } from './services/apiClient';
import { ActiveSessionConfig } from './types/session';
import { AppErrorDetails } from './types/errors';

export const AppContent: React.FC = () => {
  const [activeSession, setActiveSession] = useState<ActiveSessionConfig | null>(() => {
    const saved = localStorage.getItem('guardian-session-config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('guardian-session-config', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('guardian-session-config');
    }
  }, [activeSession]);
  const [activeTab, setActiveTab] = useState<'terminal' | 'history'>('terminal');

  // Backend connectivity tracking
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [backendError, setBackendError] = useState<AppErrorDetails | null>(null);

  const checkBackendHealth = useCallback(async () => {
    const res = await apiClient.checkHealth();
    if (res.success) {
      setBackendStatus('online');
      setBackendError(null);
    } else {
      setBackendStatus('offline');
      setBackendError(parseAppError(res.error));
    }
  }, []);

  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(interval);
  }, [checkBackendHealth]);

  if (!activeSession) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
        {backendStatus === 'offline' && backendError && (
          <div className="p-3 bg-zinc-950 border-b border-zinc-800">
            <GlobalErrorBanner
              error={backendError}
              onRetry={checkBackendHealth}
              compact
            />
          </div>
        )}
        <div className="flex-1 overflow-auto">
          <SessionSetup
            onSessionInitialized={(config) => setActiveSession(config)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Sleek Cyber Navigation Bar */}
        <header className="flex flex-wrap md:flex-nowrap items-center justify-between border-b border-emerald-900/30 bg-zinc-950/90 backdrop-blur-xl px-4 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)] z-20">
          <div className="flex items-center space-x-4 mb-2 md:mb-0">
            <div className="flex items-center gap-2 border-r border-zinc-800 pr-4">
              <span className="text-xl">🛡️</span>
              <h1 className="text-sm md:text-base font-black tracking-widest text-zinc-100 uppercase drop-shadow-md">
                THE GUARDIAN <span className="text-emerald-400">OF KALICHE</span>
              </h1>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-black/50 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-800">
                WSL2 NATIVE
              </span>
              <span
                className={`rounded px-2 py-0.5 text-[10px] font-mono uppercase font-bold border ${
                  activeSession.operationMode === 'autonomous'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                }`}
              >
                MODO: {activeSession.operationMode === 'autonomous' ? 'AUTÓNOMO' : 'SUGERENCIA'}
              </span>
              <span className="rounded bg-black/50 px-2 py-0.5 text-[10px] font-mono text-zinc-400 border border-zinc-800 hidden lg:inline">
                ALCANCE: <strong className="text-zinc-200">{activeSession.authorizedTargets.length} OBJ</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Backend Connectivity Status Badge */}
            <span
              title={
                backendStatus === 'online'
                  ? 'El backend está conectado (127.0.0.1:8765)'
                  : 'El backend está desconectado'
              }
              className={`flex items-center space-x-1.5 px-2 py-1 text-[10px] uppercase font-mono font-bold tracking-wider ${
                backendStatus === 'online'
                  ? 'text-emerald-400'
                  : backendStatus === 'offline'
                  ? 'text-red-400 animate-pulse'
                  : 'text-zinc-500'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full shadow-lg ${
                  backendStatus === 'online'
                    ? 'bg-emerald-400 shadow-emerald-500'
                    : backendStatus === 'offline'
                    ? 'bg-red-400 shadow-red-500'
                    : 'bg-zinc-500'
                }`}
              />
              <span>{backendStatus === 'online' ? 'API OK' : 'API FAIL'}</span>
            </span>

            <div className="w-px h-5 bg-zinc-800 hidden md:block"></div>

            {/* View Mode Selector - Sleeker Tabs */}
            <nav className="flex items-center rounded-md bg-zinc-900/50 p-1 border border-zinc-800/50">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-all duration-200 uppercase tracking-wider ${
                  activeTab === 'terminal'
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/30'
                    : 'text-zinc-500 hover:text-zinc-300 transparent border border-transparent'
                }`}
              >
                &gt;_ Terminal
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 text-xs font-bold rounded transition-all duration-200 uppercase tracking-wider ${
                  activeTab === 'history'
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-sm border border-emerald-500/30'
                    : 'text-zinc-500 hover:text-zinc-300 transparent border border-transparent'
                }`}
              >
                📜 Historial
              </button>
            </nav>

            <button
              onClick={() => {
                localStorage.removeItem('guardian-session-id');
                setActiveSession(null);
              }}
              title="Cerrar y destruir sesión"
              className="ml-2 p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 rounded border border-transparent transition-all"
            >
              <span className="sr-only">Terminar Sesión</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
          </div>
        </header>

        {/* Global Error Banner if backend goes offline during session */}
        {backendStatus === 'offline' && backendError && (
          <div className="p-2 border-b border-zinc-800 bg-zinc-950">
            <GlobalErrorBanner
              error={backendError}
              onRetry={checkBackendHealth}
              compact
            />
          </div>
        )}

        {/* Tab Content View */}
        <main className="flex-1 overflow-hidden relative">
          <div className={`h-full w-full ${activeTab === 'terminal' ? 'block' : 'hidden'}`}>
            <TerminalView />
          </div>
          {activeTab === 'history' && (
            <div className="h-full w-full p-3">
              <SessionHistory
                sessionId={activeSession.sessionId}
                onSelectCommand={(cmdText) => {
                  setActiveTab('terminal');
                  if (window.terminalAPI) {
                    window.terminalAPI.sendInput(cmdText + '\n');
                  }
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* AI Co-pilot Chat Sidebar */}
      <ChatPanel activeSession={activeSession} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;
