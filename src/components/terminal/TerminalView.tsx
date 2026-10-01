import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { AppErrorDetails } from '../../types/errors';
import { apiClient } from '../../services/apiClient';

export const TerminalView: React.FC = () => {
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [wslError, setWslError] = useState<AppErrorDetails | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [cmdInput, setCmdInput] = useState('');

  useEffect(() => {
    if (!window.terminalAPI) {
      setWslError({
        kind: 'WSL_UNAVAILABLE',
        title: 'WSL2 Terminal Bridge Unavailable',
        message: 'The secure native IPC bridge to Kali Linux on WSL2 could not be established.',
        actionLabel: 'Check WSL Status',
        actionHint: 'Ensure Electron is running with preload enabled and Kali Linux distribution is installed (wsl -l -v).',
      });
      return;
    }
    setWslError(null);

    if (!terminalContainerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: '"JetBrains Mono", Consolas, "Fira Code", monospace',
      fontSize: 13,
      theme: {
        background: '#0c0e14',
        foreground: '#e6edf3',
        cursor: '#4edea3', // primary color
        selectionBackground: 'rgba(78, 222, 163, 0.3)',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalContainerRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = term;
    fitAddonRef.current = fitAddon;

    const onDataDisposable = term.onData((data: string) => {
      if (window.terminalAPI) window.terminalAPI.sendInput(data);
    });

    let unsubscribeOutput: (() => void) | undefined;
    if (window.terminalAPI) {
      unsubscribeOutput = window.terminalAPI.onOutput((data: string) => {
        term.write(data);
      });
      setTimeout(() => {
        if (window.terminalAPI) window.terminalAPI.sendInput('\r');
      }, 500);
    }

    const handleResize = () => {
      try { fitAddon.fit(); } catch (err) {}
    };

    const resizeObserver = new ResizeObserver(() => handleResize());
    if (terminalContainerRef.current) {
      resizeObserver.observe(terminalContainerRef.current);
    }

    window.addEventListener('resize', handleResize);
    term.focus();

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      onDataDisposable.dispose();
      if (unsubscribeOutput) unsubscribeOutput();
      term.dispose();
      terminalInstanceRef.current = null;
      fitAddonRef.current = null;
      (window as any).getTerminalText = undefined;
    };
  }, []);

  useEffect(() => {
    (window as any).getTerminalText = () => {
      const term = terminalInstanceRef.current;
      if (!term) return '';
      const buffer = term.buffer.active;
      let text = '';
      const start = Math.max(0, buffer.cursorY + buffer.viewportY - 40);
      for (let i = start; i <= buffer.cursorY + buffer.viewportY; i++) {
        const line = buffer.getLine(i);
        if (line) text += line.translateToString(true).trimEnd() + '\n';
      }
      return text.trim();
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest overflow-hidden justify-between">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-space-xl py-space-lg bg-surface-container-low border-b border-outline-variant">
        <div className="flex items-center gap-space-lg">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-surface-container text-primary font-terminal-stream text-terminal-stream font-bold">
            &gt;_
          </div>
          <div className="flex items-center gap-space-md">
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-wide uppercase font-semibold">
              Terminal de Kali Linux
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              CONECTADO A WSL2
            </span>
          </div>
        </div>
      </div>
      
      {/* Web Preview Mock Banner for Debug */}
      {wslError && !bannerDismissed && (
        <div className="absolute inset-x-4 top-24 z-20 shadow-2xl">
          <div className="rounded-xl border border-tertiary-container bg-surface-container-high p-4 flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <span className="material-symbols-outlined text-[24px] text-tertiary">warning</span>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-wider">Vista Previa de Navegador Web</h3>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">
                  Ejecuta <code className="bg-surface-container text-primary px-1 py-0.5 rounded">npm start</code> para conectar nativamente a WSL2.
                </p>
              </div>
            </div>
            <button onClick={() => setBannerDismissed(true)} className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Terminal Viewport */}
      <div className="flex-1 p-space-md bg-[#0c0e14] overflow-hidden relative">
        <div ref={terminalContainerRef} className="h-full w-full" />
      </div>

      {/* Terminal Input Strip */}
      <div className="bg-surface-container-low p-space-lg flex flex-col gap-space-md shadow-inner border-t border-outline-variant">
        <form 
                    onSubmit={(e) => {
              e.preventDefault();
              if (cmdInput.trim() && window.terminalAPI) {
                const cmd = cmdInput;
                window.terminalAPI.sendInput(cmd + String.fromCharCode(13));
                setCmdInput('');
                apiClient.logManualCommand(cmd, localStorage.getItem('guardian-session-id') || null).catch(() => {});
              }
            }} 
          className="flex items-center gap-space-md"
        >
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-4 text-primary font-terminal-stream font-bold text-lg select-none">&gt;</span>
            <input
              type="text"
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
              placeholder="Escribe tu comando aquí (ej. nmap -sV 10.10.10.10)..."
              className="w-full bg-surface-container font-terminal-stream text-on-surface placeholder:text-outline text-base rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:bg-surface-container-high transition-colors"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button 
            type="submit" 
            disabled={!cmdInput.trim()}
            className="bg-primary text-on-primary hover:bg-surface-tint font-headline-sm text-headline-sm font-semibold px-space-xl py-3 rounded-lg flex items-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[18px]">terminal</span>
            EJECUTAR COMANDO
          </button>
        </form>
        <div className="flex items-center justify-between px-space-xs font-label-sm text-label-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px] text-outline">keyboard_return</span>
            Presiona ↵ Enter para ejecutar directamente en la sesión WSL2
          </span>
        </div>
      </div>
    </div>
  );
};
