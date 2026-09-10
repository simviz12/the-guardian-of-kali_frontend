/**
 * React interactive terminal component powered by xterm.js and the FitAddon.
 * Connected via the secure preload IPC channel to a live Kali Linux WSL2 session.
 */
import React, { useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

export const TerminalView: React.FC = () => {
  const terminalContainerRef = useRef<HTMLDivElement | null>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
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
    <div className="flex-1 h-full w-full bg-[#0c0e14] p-2 overflow-hidden flex flex-col">
      <div
        ref={terminalContainerRef}
        className="flex-1 w-full h-full overflow-hidden"
      />
    </div>
  );
};
