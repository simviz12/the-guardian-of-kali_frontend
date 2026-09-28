/**
 * React interactive terminal component powered by xterm.js and the FitAddon.
 * Connected via the secure preload IPC channel to a live Kali Linux WSL2 session.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { AppErrorDetails } from '../../types/errors';

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

    if (!terminalContainerRef.current) {
      return;
    }

    // 1. Initialize xterm.js instance with Kali-styled dark theme
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: 'Consolas, "Fira Code", monospace',
      fontSize: 14,
      theme: {
        background: '#0c0e14',
        foreground: '#e6edf3',
        cursor: '#00ff66',
        selectionBackground: 'rgba(56, 189, 248, 0.3)',
        black: '#0c0e14',
        red: '#ff5555',
        green: '#50fa7b',
        yellow: '#f1fa8c',
        blue: '#bd93f9',
        magenta: '#ff79c6',
        cyan: '#8be9fd',
        white: '#bfbfbf',
      },
    });

    // 2. Attach the Fit Addon for dynamic auto-sizing
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    // 3. Open the terminal inside the container element
    term.open(terminalContainerRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = term;
    fitAddonRef.current = fitAddon;

    // 4. Forward keystrokes and user inputs to the WSL pseudoterminal
    const onDataDisposable = term.onData((data: string) => {
      if (window.terminalAPI) {
        window.terminalAPI.sendInput(data);
      }
    });

    // 5. Subscribe to real-time streaming output from Kali Linux
    let unsubscribeOutput: (() => void) | undefined;
    if (window.terminalAPI) {
      unsubscribeOutput = window.terminalAPI.onOutput((data: string) => {
        term.write(data);
      });
    }

    // 6. Handle container and window resize events dynamically
    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch (err) {
        console.warn('Error refitting terminal:', err);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (terminalContainerRef.current) {
      resizeObserver.observe(terminalContainerRef.current);
    }

    window.addEventListener('resize', handleResize);

    // Initial focus on the terminal
    term.focus();

    // 7. Cleanup resources on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      onDataDisposable.dispose();
      if (unsubscribeOutput) {
        unsubscribeOutput();
      }
      term.dispose();
      terminalInstanceRef.current = null;
      fitAddonRef.current = null;
    };
  }, []);

  return (
    <div className="flex-1 h-full w-full bg-[#0c0e14] p-3 overflow-hidden flex flex-col relative">
      {wslError && !bannerDismissed && (
        <div className="absolute inset-x-4 top-4 z-20 shadow-2xl">
          <div className="rounded-xl border border-amber-500/40 bg-zinc-900/95 p-4 text-zinc-100 backdrop-blur-md flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <span className="text-2xl">🐧</span>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-zinc-100">Modo Navegador Web Activo</h3>
                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono text-amber-300 font-bold border border-amber-500/30">
                    Vista Previa Web
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
                  Los comandos de escaneo y pruebas que propone el <strong>Copiloto Gemini</strong> se ejecutan y devuelven su salida en la tarjeta del chat y en la pestaña <strong>Session History</strong>.
                </p>
                <p className="mt-1.5 text-[11px] text-zinc-400 font-mono">
                  Para tener la terminal interactiva con acceso directo a la shell de Kali Linux en WSL2, abre una terminal y escribe: <code className="text-emerald-400 bg-zinc-950 px-1.5 py-0.5 rounded">npm start</code>
                </p>
              </div>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="text-zinc-400 hover:text-white text-lg font-bold px-2 py-1 transition"
              title="Cerrar aviso"
            >
              ×
            </button>
          </div>
        </div>
      )}
      <div
        ref={terminalContainerRef}
        className="flex-1 w-full h-full overflow-hidden"
      />
      
      {/* Command Input Bar */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (cmdInput.trim() && window.terminalAPI) {
            window.terminalAPI.sendInput(cmdInput + '\r');
            setCmdInput('');
          }
        }}
        className="mt-3 flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 rounded-lg p-1.5 focus-within:border-emerald-500/50 focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all"
      >
        <span className="text-emerald-500 font-mono pl-3 font-bold">┌──(carlos㉿kali)-[~]<br/>└─$</span>
        <input
          type="text"
          value={cmdInput}
          onChange={(e) => setCmdInput(e.target.value)}
          placeholder="Pega o escribe un comando aquí y presiona Enter..."
          className="flex-1 bg-transparent border-none text-zinc-100 font-mono text-sm focus:outline-none focus:ring-0 px-2"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="submit"
          disabled={!cmdInput.trim()}
          className="bg-emerald-600/20 text-emerald-400 hover:bg-emerald-500 hover:text-zinc-950 border border-emerald-500/30 font-bold px-4 py-1.5 rounded-md text-xs uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Ejecutar
        </button>
      </form>
    </div>
  );
};
