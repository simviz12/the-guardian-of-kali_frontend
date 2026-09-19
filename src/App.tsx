import React, { useState, useEffect, useCallback } from 'react';
import { TerminalView } from './components/terminal/TerminalView';
import { ChatPanel } from './components/chat/ChatPanel';
import { SessionHistory } from './components/history/SessionHistory';
import { SessionSetup } from './components/session/SessionSetup';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { GlobalErrorBanner } from './components/common/GlobalErrorBanner';
import { IntroVideoModal } from './components/intro/IntroVideoModal';
import { apiClient, parseAppError } from './services/apiClient';
import { ActiveSessionConfig } from './types/session';
import { AppErrorDetails } from './types/errors';

export const AppContent: React.FC = () => {
  const [showIntro, setShowIntro] = useState<boolean>(() => {
    return sessionStorage.getItem('kali_intro_shown') !== 'true';
  });
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

  const handleIntroComplete = () => {
    sessionStorage.setItem('kali_intro_shown', 'true');
    setShowIntro(false);
  };

  const handleReplayIntro = () => {
    setShowIntro(true);
  };

  if (!activeSession) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-950 text-zinc-100">
        {showIntro && <IntroVideoModal onComplete={handleIntroComplete} />}
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
            onReplayIntro={handleReplayIntro}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {showIntro && <IntroVideoModal onComplete={handleIntroComplete} />}
      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-5 py-3">
          <div className="flex items-center space-x-4">
            <span className="text-sm md:text-base font-black uppercase tracking-wider text-emerald-400 font-mono">
              The Guardian of Kali
            </span>
            <span className="rounded bg-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-300 border border-zinc-700">
              WSL2 Native
            </span>
            <span
              className={`rounded px-2.5 py-1 text-xs font-mono uppercase font-bold border ${
                activeSession.operationMode === 'autonomous'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              }`}
            >
              MODO {activeSession.operationMode === 'autonomous' ? 'AUTÓNOMO' : 'SUGERENCIA'}
            </span>
            <span className="text-xs md:text-sm font-mono text-zinc-400 hidden lg:inline">
              Alcance: <span className="text-zinc-200 font-bold">{activeSession.authorizedTargets.length} objetivo(s)</span>
            </span>

            {/* Backend Connectivity Status Badge */}
            <span
              title={
                backendStatus === 'online'
                  ? 'El backend está conectado (127.0.0.1:8765)'
                  : 'El backend está desconectado'
              }
              className={`flex items-center space-x-2 rounded px-2.5 py-1 text-xs font-mono font-medium ${
                backendStatus === 'online'
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                  : backendStatus === 'offline'
                  ? 'bg-red-950/60 text-red-400 border border-red-800/40 animate-pulse'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  backendStatus === 'online'
                    ? 'bg-emerald-400'
                    : backendStatus === 'offline'
                    ? 'bg-red-400'
                    : 'bg-zinc-400'
                }`}
              />
              <span>{backendStatus === 'online' ? 'API CONECTADA' : 'API DESCONECTADA'}</span>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Intro Video Replay Button */}
            <button
              onClick={handleReplayIntro}
              title="Volver a reproducir el video de inicio"
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-700 bg-zinc-800/80 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/50 transition"
            >
              🎬 Intro
            </button>

            {/* View Mode Selector */}
            <nav className="flex items-center space-x-1.5 rounded-lg bg-zinc-950 p-1.5 border border-zinc-800">
              <button
                onClick={() => setActiveTab('terminal')}
                className={`px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-md transition ${
                  activeTab === 'terminal'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Consola Terminal
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3.5 py-1.5 text-xs md:text-sm font-semibold rounded-md transition ${
                  activeTab === 'history'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Historial de Sesión
              </button>
            </nav>

            {/* End / Reconfigure Session */}
            <button
              onClick={() => setActiveSession(null)}
              title="Finalizar y reconfigurar la sesión"
              className="px-3 py-1.5 text-xs md:text-sm font-semibold rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
            >
              Finalizar Sesión
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
