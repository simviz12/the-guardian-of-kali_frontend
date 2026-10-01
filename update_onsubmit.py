import os

with open('src/components/terminal/TerminalView.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

import re
c = re.sub(r'onSubmit=\{\(e\) => \{[\s\S]*?\}\}', '''onSubmit={(e) => {
              e.preventDefault();
              if (cmdInput.trim() && window.terminalAPI) {
                const cmd = cmdInput;
                window.terminalAPI.sendInput(cmd + '\\r');
                setCmdInput('');
                apiClient.logManualCommand(cmd, localStorage.getItem('guardian-session-id') || null).catch(() => {});
              }
            }}''', c)

with open('src/components/terminal/TerminalView.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
