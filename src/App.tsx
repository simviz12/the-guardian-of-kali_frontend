import React, { useState } from 'react';
import { TerminalView } from './components/terminal/TerminalView';
import { ChatPanel } from './components/chat/ChatPanel';
import { SessionHistory } from './components/history/SessionHistory';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'history'>('terminal');

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
          </div>

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
        </header>

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
      <ChatPanel />
    </div>
  );
};

export default App;

