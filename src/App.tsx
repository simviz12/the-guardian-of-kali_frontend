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
  const [activeSession, setActiveSession] = useState<ActiveSessionConfig | null>(null);
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
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950">
        {backendStatus === 'offline' && backendError && (
          <div className="p-3 bg-zinc-950 border-b border-zinc-800">
            <GlobalErrorBanner
              error={backendError}
              onRetry={checkBackendHealth}
              compact
            />
          </div>
        )}
        <div className="flex-1 overflow-hidden">
          <SessionSetup onSessionInitialized={(config) => setActiveSession(config)} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950">
      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-4 py-2">
          <div className="flex items-center space-x-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
              The Guardian of Kali
            </span>
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
              WSL2 Native
            </span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-mono uppercase font-bold border ${
                activeSession.operationMode === 'autonomous'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}
            >
              {activeSession.operationMode} MODE
            </span>
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
              Scope: <span className="text-zinc-200">{activeSession.authorizedTargets.length} target(s)</span>
            </span>

            {/* Backend Connectivity Status Badge */}
            <span
              title={
                backendStatus === 'online'
                  ? 'Backend service is reachable (127.0.0.1:8765)'
                  : 'Backend service is offline'
              }
              className={`flex items-center space-x-1 rounded px-1.5 py-0.5 text-[10px] font-mono ${
                backendStatus === 'online'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : backendStatus === 'offline'
                  ? 'bg-red-950/60 text-red-400 border border-red-800/40 animate-pulse'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  backendStatus === 'online'
                    ? 'bg-emerald-400'
                    : backendStatus === 'offline'
                    ? 'bg-red-400'
                    : 'bg-zinc-400'
                }`}
              />
              <span>{backendStatus === 'online' ? 'API OK' : 'API OFFLINE'}</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* View Mode Selector */}
            <nav className="flex items-center space-x-1 rounded-lg bg-zinc-950 p-1 border border-zinc-800">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  activeTab === 'terminal'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Terminal Console
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  activeTab === 'history'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Session History
              </button>
            </nav>

            {/* End / Reconfigure Session */}
            <button
              onClick={() => setActiveSession(null)}
              title="Close and reconfigure security session"
              className="px-2.5 py-1 text-xs font-medium rounded-md border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
            >
              End Session
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
              <SessionHistory />
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
