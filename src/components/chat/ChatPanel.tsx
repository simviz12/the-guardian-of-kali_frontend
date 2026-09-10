/**
 * Chat panel component for conversational interaction with the AI assistant.
 */
import React from 'react';

export const ChatPanel: React.FC = () => {
  return (
    <div className="w-96 border-l border-zinc-800 bg-zinc-950 p-4 text-white">
      <h2 className="text-lg font-semibold">Guardian AI Co-pilot</h2>
      <p className="text-sm text-zinc-400">Ready to assist with CTF and lab challenges.</p>
    </div>
  );
};
