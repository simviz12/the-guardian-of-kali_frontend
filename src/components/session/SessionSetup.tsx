import React, { useState, useEffect } from 'react';
import { ActiveSessionConfig, OperationMode } from '../../types/session';
import { apiClient } from '../../services/apiClient';

export interface SessionSetupProps {
  onSessionInitialized: (config: ActiveSessionConfig) => void;
  isBackendOnline: boolean;
}

export const SessionSetup: React.FC<SessionSetupProps> = ({ onSessionInitialized, isBackendOnline }) => {
  const [operatorId, setOperatorId] = useState('carlos');
  const [targetScope, setTargetScope] = useState('10.10.10.10');
  const [operationMode, setOperationMode] = useState<OperationMode>('suggestion');
  const [isInitializing, setIsInitializing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);

  useEffect(() => {
    if (!isBackendOnline) {
      setHasApiKey(null); // Keep loading state while backend connects
      return;
    }
    apiClient.getApiKeyStatus().then(res => {
      if (res.success) {
        setHasApiKey(res.data.has_key);
      } else {
        setHasApiKey(false);
      }
    });
  }, [isBackendOnline]);

  const saveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setIsSavingKey(true);
    const res = await apiClient.updateApiKey(apiKeyInput.trim());
    setIsSavingKey(false);
    if (res.success) {
      setHasApiKey(true);
    }
  };

  const simulateInit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsInitializing(true);
    setTimeout(() => {
      onSessionInitialized({
        sessionId: crypto.randomUUID(),
        operationMode,
        authorizedTargets: [{ value: targetScope, description: 'User defined scope' }],
        user: operatorId, startedAt: new Date().toISOString(),
      });
    }, 1200);
  };

  if (hasApiKey === null) {
    return (
      <div className="bg-surface-container-lowest text-on-surface flex items-center justify-center min-h-screen">
        <span className="material-symbols-outlined animate-spin text-[32px] text-primary">progress_activity</span>
      </div>
    );
  }

  if (hasApiKey === false) {
    return (
      <div className="bg-surface-container-lowest text-on-surface font-body-sm text-body-sm flex items-center justify-center min-h-screen">
        <main className="w-full max-w-md p-space-xl border border-outline-variant bg-surface-dim">
          <div className="flex flex-col items-center text-center mb-space-lg">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[24px] text-primary">key</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface mb-0.5 uppercase font-semibold">
              Requisito de ConfiguraciÃ³n
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-2">
              Para que The Guardian of Kaliche funcione, necesitas proveer una <strong>API Key de Google Gemini</strong>.
            </p>
          </div>
          
          <form onSubmit={saveApiKey} className="flex flex-col gap-space-md">
            <div className="flex flex-col gap-1">
              <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-medium">Gemini API Key</label>
              <input 
                type="password"
                required
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-surface-container border border-outline-variant rounded p-3 text-on-surface focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSavingKey}
              className="mt-2 w-full bg-primary hover:bg-surface-tint text-on-primary font-headline-sm text-headline-sm uppercase tracking-wider py-3 rounded flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSavingKey ? 'Guardando...' : 'Guardar y Continuar'}
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-lowest text-on-surface font-body-sm text-body-sm flex items-center justify-center min-h-screen">
      <main className="w-full max-w-md p-space-xl border border-outline-variant bg-surface-dim">
        <div className="flex flex-col w-full">
          <div className="flex flex-col items-center justify-center p-space-sm sm:p-space-lg w-full">
            
            {/* Centered Application Identity Header */}
            <div className="flex flex-col items-center text-center mb-space-lg">
              <h1 className="font-headline-lg text-headline-lg tracking-tight text-on-surface mb-0.5 uppercase font-semibold">
                The Guardian of Kaliche
              </h1>
              <p className="font-label-sm text-label-sm uppercase tracking-widest text-outline mb-space-sm font-medium">
                Consola de Operaciones de Seguridad
              </p>
              <div className="flex items-center gap-space-xs flex-wrap justify-center">
                <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-1.5 py-0.5 rounded uppercase">
                  Aplicación de Escritorio
                </span>
                <span className="bg-surface-container text-primary font-label-sm text-label-sm px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                  WSL2 Native
                </span>
                <span className="bg-surface-container text-tertiary font-label-sm text-label-sm px-1.5 py-0.5 rounded uppercase">
                  Kali Linux
                </span>
              </div>
            </div>

            {/* Core Initialization Workstation Card */}
            <div className="w-full bg-surface-container-low rounded-lg p-space-md sm:p-space-lg shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80"></div>
              
              <form className="flex flex-col gap-space-md" onSubmit={simulateInit}>
                {/* OPERATOR IDENTITY SECTION */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-medium flex items-center gap-1.5" htmlFor="operator-id">
                      <span className="material-symbols-outlined text-[14px] text-primary">badge</span>
                      Identidad del Operador
                    </label>
                    <span className="font-label-sm text-label-sm text-outline">SESSION ID: #0x9F41</span>
                  </div>
                  <div className="relative bg-surface-container rounded flex items-center px-space-sm py-1 focus-within:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-outline mr-2">person</span>
                    <input 
                      id="operator-id" 
                      type="text" 
                      required 
                      value={operatorId}
                      onChange={(e) => setOperatorId(e.target.value)}
                      placeholder="operator_alias" 
                      className="w-full bg-transparent font-label-md text-label-md text-on-surface focus:outline-none placeholder-outline" 
                    />
                    <span className="w-1.5 h-3.5 bg-primary animate-pulse ml-1 inline-block"></span>
                  </div>
                </div>

                {/* TARGET SCOPE SECTION */}
                <div className="flex flex-col gap-1 mt-space-sm">
                  <div className="flex items-center justify-between">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-medium flex items-center gap-1.5" htmlFor="target-scope">
                      <span className="material-symbols-outlined text-[14px] text-error">my_location</span>
                      Alcance Autorizado (IP/Dominio)
                    </label>
                    <span className="font-label-sm text-label-sm text-error">RESTRINGIDO</span>
                  </div>
                  <div className="relative bg-surface-container border border-error/20 rounded flex items-center px-space-sm py-1 focus-within:border-error/50 transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-error mr-2">dns</span>
                    <input 
                      id="target-scope" 
                      type="text" 
                      required 
                      value={targetScope}
                      onChange={(e) => setTargetScope(e.target.value)}
                      placeholder="IP o Dominio (ej. 10.10.10.10)" 
                      className="w-full bg-transparent font-label-md text-label-md text-on-surface focus:outline-none placeholder-outline" 
                    />
                  </div>
                </div>

                {/* TARGET PORTS SECTION */}
                <div className="flex flex-col gap-1 mt-space-sm">
                  <div className="flex items-center justify-between">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-medium flex items-center gap-1.5" htmlFor="target-ports">
                      <span className="material-symbols-outlined text-[14px] text-tertiary">lan</span>
                      Puertos Permitidos
                    </label>
                    <span className="font-label-sm text-label-sm text-tertiary">OPCIONAL</span>
                  </div>
                  <div className="relative bg-surface-container border border-outline-variant rounded flex items-center px-space-sm py-1 focus-within:border-tertiary/50 transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-tertiary mr-2">settings_ethernet</span>
                    <input 
                      id="target-ports" 
                      type="text" 
                      placeholder="Ej. 80, 443, 8080-8090 o dejar en blanco" 
                      className="w-full bg-transparent font-label-md text-label-md text-on-surface focus:outline-none placeholder-outline" 
                    />
                  </div>
                </div>

                {/* ZERO-TRUST ENGAGEMENT POLICY SECTION */}
                <div className="flex flex-col gap-1 mt-space-sm">
                  <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-medium flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[14px] text-tertiary">gavel</span>
                    PolÃ­tica de IntervenciÃ³n Zero-Trust
                  </label>
                  
                  <div className="grid grid-cols-2 gap-space-sm">
                    {/* Policy Card: Assist */}
                    <label 
                      className={`relative flex flex-col p-space-sm rounded border cursor-pointer transition-all ${
                        operationMode === 'suggestion' 
                          ? 'border-tertiary bg-tertiary-container/10' 
                          : 'border-outline-variant bg-surface-container hover:bg-surface-container-high'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="mode" 
                        value="suggestion" 
                        checked={operationMode === 'suggestion'}
                        onChange={(e) => setOperationMode(e.target.value as OperationMode)}
                        className="sr-only" 
                      />
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-headline-sm text-headline-sm uppercase ${operationMode === 'suggestion' ? 'text-tertiary' : 'text-on-surface'}`}>
                          Assist
                        </span>
                        <span className={`material-symbols-outlined text-[16px] ${operationMode === 'suggestion' ? 'text-tertiary' : 'text-outline-variant'}`}>
                          lightbulb
                        </span>
                      </div>
                      <span className="font-body-sm text-[10px] leading-tight text-on-surface-variant">
                        La IA sugiere comandos. El operador aprueba explÃ­citamente su ejecuciÃ³n.
                      </span>
                    </label>

                    {/* Policy Card: Autonomous */}
                    <label 
                      className={`relative flex flex-col p-space-sm rounded border cursor-pointer transition-all ${
                        operationMode === 'autonomous' 
                          ? 'border-error bg-error-container/10' 
                          : 'border-outline-variant bg-surface-container hover:bg-surface-container-high'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="mode" 
                        value="autonomous" 
                        checked={operationMode === 'autonomous'}
                        onChange={(e) => setOperationMode(e.target.value as OperationMode)}
                        className="sr-only" 
                      />
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-headline-sm text-headline-sm uppercase ${operationMode === 'autonomous' ? 'text-error' : 'text-on-surface'}`}>
                          Autonomy
                        </span>
                        <span className={`material-symbols-outlined text-[16px] ${operationMode === 'autonomous' ? 'text-error' : 'text-outline-variant'}`}>
                          smart_toy
                        </span>
                      </div>
                      <span className="font-body-sm text-[10px] leading-tight text-on-surface-variant">
                        La IA ejecuta comandos seguros automÃ¡ticamente. Alto riesgo requiere aprobaciÃ³n.
                      </span>
                    </label>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isInitializing}
                  className="mt-space-md w-full bg-primary hover:bg-surface-tint text-on-primary font-headline-sm text-headline-sm uppercase tracking-wider py-3 rounded flex items-center justify-center gap-2 transition-colors relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isInitializing ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                        Estableciendo Enlace Zero-Trust...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">lock_open</span>
                        Iniciar Sesión Segura
                      </>
                    )}
                  </span>
                  {!isInitializing && (
                    <div className="absolute inset-0 h-full w-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                  )}
                </button>
              </form>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
};
