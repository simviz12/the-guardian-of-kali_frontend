import React, { useState } from 'react';
import { ActiveSessionConfig, AuthorizedTargetConfig, OperationMode } from '../../types/session';

export interface SessionSetupProps {
  onSessionInitialized: (config: ActiveSessionConfig) => void;
}

export const SessionSetup: React.FC<SessionSetupProps> = ({ onSessionInitialized }) => {
  const [operatorId, setOperatorId] = useState('carlos');
  const [targetScope, setTargetScope] = useState('10.10.10.10');
  const [operationMode, setOperationMode] = useState<OperationMode>('suggestion');
  const [isInitializing, setIsInitializing] = useState(false);

  const simulateInit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsInitializing(true);
    setTimeout(() => {
      onSessionInitialized({
        sessionId: crypto.randomUUID(),
        operationMode,
        authorizedTargets: [{ value: targetScope, description: 'User defined scope' }],
        isActive: true,
      });
    }, 1200);
  };

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
                Security Operations Console
              </p>
              <div className="flex items-center gap-space-xs flex-wrap justify-center">
                <span className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm px-1.5 py-0.5 rounded uppercase">
                  Desktop Application
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
                      Operator Identity
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
                  <p className="font-body-sm text-body-sm text-outline">
                    Identify the operator responsible for this security session.
                  </p>
                </div>

                {/* ZERO-TRUST BOUNDARY SECTION */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-medium flex items-center gap-1.5" htmlFor="target-scope">
                      <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
                      Authorized Security Scope
                    </label>
                    <span className="bg-surface-container text-primary font-label-sm text-label-sm px-1.5 py-0.5 rounded flex items-center gap-1 font-semibold uppercase">
                      <span className="material-symbols-outlined text-[12px]">shield</span>
                      Boundary Active
                    </span>
                  </div>
                  <div className="relative bg-surface-container rounded flex items-center px-space-sm py-1 focus-within:bg-surface-container-high transition-colors">
                    <span className="material-symbols-outlined text-[16px] text-outline mr-2">target</span>
                    <input 
                      id="target-scope" 
                      type="text" 
                      required 
                      value={targetScope}
                      onChange={(e) => setTargetScope(e.target.value)}
                      placeholder="CIDR, IP, or Target Hostname" 
                      className="w-full bg-transparent font-terminal-stream text-terminal-stream text-on-surface focus:outline-none placeholder-outline" 
                    />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-label-sm text-label-sm text-outline">Presets:</span>
                    <button type="button" onClick={() => setTargetScope('192.168.1.0/24')} className="bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high px-1.5 py-0.5 rounded font-label-sm text-label-sm transition-colors cursor-pointer">
                      192.168.1.0/24
                    </button>
                    <button type="button" onClick={() => setTargetScope('example.local')} className="bg-surface-container text-on-surface-variant hover:text-primary hover:bg-surface-container-high px-1.5 py-0.5 rounded font-label-sm text-label-sm transition-colors cursor-pointer">
                      example.local
                    </button>
                  </div>
                  <p className="font-body-sm text-body-sm text-outline">
                    Operations outside the authorized scope will be blocked automatically.
                  </p>
                </div>

                {/* AI OPERATION MODE SECTION */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-outline font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] text-primary">psychology</span>
                      AI Operation Mode
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary font-medium uppercase">GEMINI PRO REASONER</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-xs">
                    {/* Mode 1: Analysis */}
                    <div 
                      className={`cursor-pointer p-space-sm rounded transition-all flex flex-col justify-between ${operationMode === 'suggestion' ? 'bg-surface-container' : 'bg-surface-container-lowest opacity-80 hover:opacity-100'}`} 
                      onClick={() => setOperationMode('suggestion')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-label-md text-label-md font-semibold flex items-center gap-1 ${operationMode === 'suggestion' ? 'text-primary' : 'text-on-surface'}`}>
                          <span className="material-symbols-outlined text-[16px]">{operationMode === 'suggestion' ? 'troubleshoot' : 'troubleshoot'}</span>
                          ANALYSIS MODE
                        </span>
                        <span className={`material-symbols-outlined text-[16px] ${operationMode === 'suggestion' ? 'text-primary' : 'text-outline opacity-40'}`}>
                          {operationMode === 'suggestion' ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                        The AI provides explanations, analysis and command suggestions.
                      </p>
                    </div>

                    {/* Mode 2: Execution */}
                    <div 
                      className={`cursor-pointer p-space-sm rounded transition-all flex flex-col justify-between ${operationMode === 'autonomous' ? 'bg-surface-container' : 'bg-surface-container-lowest opacity-80 hover:opacity-100'}`}
                      onClick={() => setOperationMode('autonomous')}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-label-md text-label-md font-semibold flex items-center gap-1 ${operationMode === 'autonomous' ? 'text-primary' : 'text-on-surface'}`}>
                          <span className="material-symbols-outlined text-[16px]">terminal</span>
                          EXECUTION MODE
                        </span>
                        <span className={`material-symbols-outlined text-[16px] ${operationMode === 'autonomous' ? 'text-primary' : 'text-outline opacity-40'}`}>
                          {operationMode === 'autonomous' ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-outline leading-snug">
                        The AI can propose executable commands subject to security controls.
                      </p>
                    </div>
                  </div>
                </div>

                {/* PRIMARY ACTION BUTTON */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <button 
                    id="initBtn" 
                    type="submit" 
                    disabled={isInitializing}
                    className={`w-full font-label-md text-label-md uppercase tracking-wide py-2 px-space-md rounded flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer ${isInitializing ? 'bg-primary text-on-primary opacity-90' : 'bg-primary-container hover:bg-primary-fixed text-on-primary'}`}
                  >
                    {isInitializing ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                        <span>SPAWNING SUBPROCESS BRIDGE...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">power_settings_new</span>
                        <span>Initialize Secure Session</span>
                      </>
                    )}
                  </button>
                  <div className="flex items-center justify-center gap-1 text-center">
                    <span className="material-symbols-outlined text-[13px] text-outline">lock</span>
                    <span className="font-label-sm text-label-sm text-outline">
                      Zero-Trust boundary required • Immutable cryptographic telemetry enabled
                    </span>
                  </div>
                </div>
              </form>
            </div>

            {/* Environmental Telemetry Footer Strip */}
            <div className="w-full mt-space-sm bg-surface-container-lowest p-space-xs rounded flex flex-col sm:flex-row items-center justify-between gap-1 text-outline font-label-sm text-label-sm">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-primary font-semibold uppercase">KERNEL:</span>
                <span className="truncate">Linux 5.15.153.1-microsoft-standard-WSL2 (x86_64)</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-tertiary uppercase">DISTRO:</span>
                  <span>Kali Rolling 2024.1</span>
                </div>
                <div className="flex items-center gap-1 bg-surface-container px-1.5 py-0.5 rounded text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  <span>Gemini: 42ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
