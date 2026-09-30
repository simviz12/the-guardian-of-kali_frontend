import React, { useState, useEffect, useCallback } from 'react';
import { TerminalView } from './components/terminal/TerminalView';
import { ChatPanel } from './components/chat/ChatPanel';
import { SessionHistory } from './components/history/SessionHistory';
import { SessionSetup } from './components/session/SessionSetup';
import { SettingsView } from './components/settings/SettingsView';
import { GuideView } from './components/guide/GuideView';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { GlobalErrorBanner } from './components/common/GlobalErrorBanner';
import { ActiveSessionConfig } from './types/session';
import { apiClient } from './services/apiClient';
import { AppErrorDetails } from './types/errors';
import { parseAppError } from './services/apiClient';

const AppContent: React.FC = () => {
  const [activeSession, setActiveSession] = useState<ActiveSessionConfig | null>(() => {
    const saved = localStorage.getItem('guardian-session-id');
    if (saved) {
      return {
        sessionId: saved,
        operationMode: 'suggestion',
        authorizedTargets: [],
        user: 'carlos', startedAt: new Date().toISOString(),
      };
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<'terminal' | 'history' | 'settings' | 'guide'>('terminal');
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [backendError, setBackendError] = useState<AppErrorDetails | null>(null);

  const checkBackendHealth = useCallback(async () => {
    const res = await apiClient.checkHealth();
    if (res.success) {
      setBackendStatus('online');
      setBackendError(null);
      return true;
    } else {
      setBackendStatus('offline');
      setBackendError(parseAppError(res.error));
      return false;
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const connectToBackend = async () => {
      const isOnline = await checkBackendHealth();
      if (!isOnline) {
        setTimeout(connectToBackend, 2000);
      } else {
        interval = setInterval(checkBackendHealth, 15000);
      }
    };
    connectToBackend();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [checkBackendHealth]);

  if (!activeSession) {
    return (
      <div className="flex flex-col min-h-screen bg-surface-container-lowest text-on-surface">
        {backendStatus === 'offline' && backendError && (
          <div className="p-3 bg-surface-dim border-b border-outline-variant">
            <GlobalErrorBanner error={backendError} onRetry={checkBackendHealth} compact />
          </div>
        )}
        <SessionSetup 
          onSessionInitialized={(config) => setActiveSession(config)} 
          isBackendOnline={backendStatus === 'online'} 
        />
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest text-on-surface font-body-sm text-body-sm select-none min-h-screen overflow-hidden">
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-surface-container-lowest border-b border-outline-variant">
        <div className="h-8 px-margin flex items-center justify-between bg-surface-dim text-on-surface">
          <div className="flex items-center gap-space-sm">
            <span className="font-label-sm text-label-sm uppercase font-semibold text-primary tracking-wider">THE GUARDIAN OF KALICHE</span>
            <span className="font-label-sm text-label-sm px-space-xs py-0.5 bg-surface-container-low text-on-surface-variant border border-outline-variant rounded">NATIVO WSL2</span>
            <span className="font-label-sm text-label-sm px-space-xs py-0.5 bg-surface-container-low text-tertiary border border-outline-variant rounded">
              ALCANCE: {activeSession.authorizedTargets[0]?.value || '10.10.10.10'}
            </span>
          </div>
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm text-on-surface-variant">
              <span className={`w-1.5 h-1.5 rounded-full ${backendStatus === 'online' ? 'bg-primary-container animate-pulse' : 'bg-error'}`}></span>
              <span>API {backendStatus === 'online' ? 'OK' : 'ERROR'}</span>
            </div>
            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center ml-2">
              <span className="material-symbols-outlined text-on-primary text-[14px]">person</span>
            </div>
          </div>
        </div>
        <div className="h-9 px-margin flex items-center justify-between bg-surface-container-low border-t border-outline-variant">
          <nav className="flex items-center gap-space-xs h-full">
            <button onClick={() => setActiveTab('terminal')} className={`h-full px-space-md flex items-center transition-colors font-label-md text-label-md ${activeTab === 'terminal' ? 'bg-surface-container-high text-primary border-b border-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}>
              TERMINAL
            </button>
            <button onClick={() => setActiveTab('history')} className={`h-full px-space-md flex items-center transition-colors font-label-md text-label-md ${activeTab === 'history' ? 'bg-surface-container-high text-primary border-b border-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}>
              HISTORIAL
            </button>
            <button onClick={() => setActiveTab('settings')} className={`h-full px-space-md flex items-center transition-colors font-label-md text-label-md ${activeTab === 'settings' ? 'bg-surface-container-high text-primary border-b border-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}>
              AJUSTES
            </button>
            <button onClick={() => setActiveTab('guide')} className={`h-full px-space-md flex items-center transition-colors font-label-md text-label-md ${activeTab === 'guide' ? 'bg-surface-container-high text-primary border-b border-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}>
              GUÍA
            </button>
          </nav>
          <div className="flex items-center">
            <button 
              onClick={() => { localStorage.removeItem('guardian-session-id'); setActiveSession(null); }}
              className="px-space-md py-1 border border-error-container text-error hover:bg-error-container hover:text-on-error-container font-label-sm text-label-sm uppercase rounded transition-colors flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-[14px]">power_settings_new</span>
              SALIR DE SESIÓN
            </button>
          </div>
        </div>
      </header>

      <aside className="fixed left-0 top-[68px] bottom-6 w-16 bg-surface-dim border-r border-outline-variant z-40 flex flex-col items-center py-space-sm gap-space-sm">
        <button onClick={() => setActiveTab('terminal')} className={`w-12 h-12 flex items-center justify-center rounded transition-colors ${activeTab === 'terminal' ? 'text-primary bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'}`} title="Matriz de Terminal">
          <span className="material-symbols-outlined text-[24px]">terminal</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`w-12 h-12 flex items-center justify-center rounded transition-colors ${activeTab === 'history' ? 'text-primary bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'}`} title="Registro de AuditorÃƒÂ­a">
          <span className="material-symbols-outlined text-[24px]">receipt_long</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`w-12 h-12 flex items-center justify-center rounded transition-colors ${activeTab === 'settings' ? 'text-primary bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'}`} title="Ajustes del Sistema">
          <span className="material-symbols-outlined text-[24px]">settings</span>
        </button>
        <button onClick={() => setActiveTab('guide')} className={`w-12 h-12 flex items-center justify-center rounded transition-colors ${activeTab === 'guide' ? 'text-primary bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'}`} title="Guía Operativa">
          <span className="material-symbols-outlined text-[24px]">menu_book</span>
        </button>
      </aside>

      <div className="pl-16 h-screen flex flex-col pt-[68px] pb-6">
        <main className="flex-1 w-full bg-surface-container-lowest overflow-hidden flex">
          {activeTab === 'terminal' && (
            <div className="w-full max-w-[1720px] mx-auto p-space-xl flex flex-col gap-space-lg h-full overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-stretch h-full overflow-hidden">
                <section className="lg:col-span-8 flex flex-col bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden border border-outline-variant">
                  <TerminalView />
                </section>
                <section className="lg:col-span-4 flex flex-col bg-surface-container-low rounded-xl shadow-xl overflow-hidden border border-outline-variant">
                  <ChatPanel activeSession={activeSession} />
                </section>
              </div>
            </div>
          )}
          {activeTab === 'history' && (
            <div className="w-full overflow-y-auto">
              <SessionHistory />
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="w-full overflow-y-auto">
              <SettingsView />
            </div>
          )}
          {activeTab === 'guide' && (
            <div className="w-full overflow-y-auto">
              <GuideView />
            </div>
          )}
        </main>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 h-6 bg-surface-dim border-t border-outline-variant z-50 px-margin flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
        <div className="flex items-center gap-space-md">
          <span>TÃšNEL: TUN0 (SEGURO)</span>
          <span>ESTADO DE SESIÃ“N: PROTEGIDO</span>
        </div>
        <div className="flex items-center gap-space-md">
          <span className="text-primary">WSL2 KERNEL: 5.15.150.1</span>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;
