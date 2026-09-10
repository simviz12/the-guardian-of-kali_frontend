import React from 'react';
import { TerminalView } from './components/terminal/TerminalView';
import { ChatPanel } from './components/chat/ChatPanel';

export const App: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-900">
      <TerminalView />
      <ChatPanel />
    </div>
  );
};

export default App;
