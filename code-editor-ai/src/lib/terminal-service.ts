'use client';

import { v4 as uuidv4 } from 'uuid';

export interface TerminalCommand {
  id: string;
  command: string;
  output: string;
  status: 'success' | 'error' | 'running';
  timestamp: Date;
}

export interface TerminalSession {
  id: string;
  name: string;
  commands: TerminalCommand[];
  createdAt: Date;
  cwd: string;
}

type TerminalListener = (sessions: TerminalSession[]) => void;

class TerminalServiceClass {
  private sessions: TerminalSession[] = [];
  private listeners: TerminalListener[] = [];
  private static defaultWorkingDir = '/project';

  constructor() {
    // Create a default session
    this.createSession('Terminal 1');
  }

  /**
   * Get all terminal sessions
   */
  getSessions(): TerminalSession[] {
    return [...this.sessions];
  }

  /**
   * Get a specific terminal session by ID
   */
  getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.find(session => session.id === sessionId);
  }

  /**
   * Create a new terminal session
   */
  createSession(name: string): TerminalSession {
    const newSession: TerminalSession = {
      id: uuidv4(),
      name,
      commands: [],
      createdAt: new Date(),
      cwd: TerminalServiceClass.defaultWorkingDir,
    };

    this.sessions.push(newSession);
    this.notifyListeners();
    return newSession;
  }

  /**
   * Remove a terminal session
   */
  removeSession(sessionId: string): void {
    this.sessions = this.sessions.filter(session => session.id !== sessionId);
    this.notifyListeners();
  }

  /**
   * Execute a command in a terminal session
   */
  async executeCommand(sessionId: string, command: string): Promise<string> {
    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Terminal session ${sessionId} not found`);
    }

    const commandObj: TerminalCommand = {
      id: uuidv4(),
      command,
      output: '',
      status: 'running',
      timestamp: new Date(),
    };

    session.commands.push(commandObj);
    this.notifyListeners();

    try {
      // In a real implementation, this would connect to a backend service
      // For this demo, we'll simulate command execution with a few supported commands
      const output = await this.simulateCommand(session, command);

      // Update command with output
      commandObj.output = output;
      commandObj.status = 'success';

      return output;
    } catch (error) {
      commandObj.status = 'error';
      commandObj.output = error instanceof Error ? error.message : 'An error occurred';
      return commandObj.output;
    } finally {
      this.notifyListeners();
    }
  }

  /**
   * Simulate command execution for demo purposes
   */
  private async simulateCommand(session: TerminalSession, command: string): Promise<string> {
    // Wait a bit to simulate processing time
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 500));

    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    // Update CWD for cd commands
    if (cmd === 'cd') {
      if (args.length === 0 || args[0] === '~') {
        session.cwd = TerminalServiceClass.defaultWorkingDir;
        return '';
      }

      const path = args[0];
      if (path.startsWith('/')) {
        session.cwd = path;
      } else {
        session.cwd = `${session.cwd}/${path}`.replace(/\/+/g, '/');
      }
      return '';
    }

    // Process other commands
    switch (cmd) {
      case 'ls':
        return `
app.js
index.html
node_modules/
package.json
public/
README.md
src/
styles.css
`;

      case 'pwd':
        return session.cwd;

      case 'echo':
        return args.join(' ');

      case 'cat':
        if (args.length === 0) {
          return 'cat: missing file operand';
        }
        return `Content of ${args[0]}`;

      case 'npm':
      case 'yarn':
      case 'bun':
        if (args[0] === 'install' || args[0] === 'add') {
          return `
Installing packages...
+ react@18.2.0
+ react-dom@18.2.0
+ typescript@5.0.4
+ ${args[1] || 'package'}@latest
Done in 2.3s.
`;
        }
        if (args[0] === 'run' || args[0] === 'start' || args[0] === 'dev') {
          return `
Starting development server...
Local:   http://localhost:3000
Network: http://192.168.1.100:3000
Ready in 1.2s.

Press Ctrl+C to stop
`;
        }
        return `Running ${cmd} ${args.join(' ')}...`;

      case 'git':
        if (args[0] === 'status') {
          return `
On branch main
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   src/App.js

no changes added to commit (use "git add" and/or "git commit -a")
`;
        }
        if (args[0] === 'clone') {
          return `
Cloning into '${args[1] ? args[1].split('/').pop()?.replace('.git', '') : 'repo'}'...
remote: Enumerating objects: 138, done.
remote: Counting objects: 100% (138/138), done.
remote: Compressing objects: 100% (98/98), done.
remote: Total 138 (delta 44), reused 124 (delta 30)
Receiving objects: 100% (138/138), 56.56 KiB | 689.00 KiB/s, done.
Resolving deltas: 100% (44/44), done.
`;
        }
        return `Git operation completed.`;

      case 'clear':
        // Special handling for clear command: remove all previous commands
        session.commands = session.commands.filter(cmd => cmd.command === command);
        return '';

      default:
        if (cmd === '') return '';

        // For unrecognized commands, return a default message
        return `${cmd}: command not found`;
    }
  }

  /**
   * Subscribe to changes in terminal sessions
   */
  subscribe(listener: TerminalListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    const sessions = this.getSessions();
    for (const listener of this.listeners) {
      listener(sessions);
    }
  }
}

// Export a singleton instance
export const TerminalService = new TerminalServiceClass();
