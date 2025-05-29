'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { TerminalCommand, TerminalService, type TerminalSession } from '@/lib/terminal-service';
import { TerminalHeader } from './terminal-header';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';

interface TerminalProps {
  className?: string;
  initialSessionId?: string;
}

export function Terminal({ className, initialSessionId }: TerminalProps) {
  const [sessions, setSessions] = React.useState<TerminalSession[]>([]);
  const [activeSessionId, setActiveSessionId] = React.useState<string | null>(null);
  const [commandInput, setCommandInput] = React.useState('');
  const [isExecuting, setIsExecuting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const terminalRef = React.useRef<HTMLDivElement>(null);
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  // History navigation
  const [historyIndex, setHistoryIndex] = React.useState(-1);
  const [commandHistory, setCommandHistory] = React.useState<string[]>([]);
  const [savedInput, setSavedInput] = React.useState('');

  // Load sessions from terminal service
  React.useEffect(() => {
    const initialSessions = TerminalService.getSessions();
    setSessions(initialSessions);

    // Set active session to the provided ID or the first session
    const sessionId = initialSessionId || (initialSessions.length > 0 ? initialSessions[0].id : null);
    setActiveSessionId(sessionId);

    // Subscribe to session changes
    const unsubscribe = TerminalService.subscribe((updatedSessions) => {
      setSessions(updatedSessions);
    });

    return unsubscribe;
  }, [initialSessionId]);

  // Auto-scroll to bottom when commands are added
  React.useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [activeSession?.commands]);

  // Focus input on mount
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeSessionId || !commandInput.trim() || isExecuting) {
      return;
    }

    setIsExecuting(true);
    const command = commandInput.trim();

    // Add to history (avoiding duplicates at the end)
    if (command !== commandHistory[commandHistory.length - 1]) {
      setCommandHistory(prev => [...prev, command]);
    }
    setHistoryIndex(-1);
    setCommandInput('');

    try {
      await TerminalService.executeCommand(activeSessionId, command);
    } catch (error) {
      console.error('Error executing command:', error);
    } finally {
      setIsExecuting(false);

      // Focus back on input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle history navigation
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex === -1 && commandInput.trim() !== '') {
        // Save current input before navigating
        setSavedInput(commandInput);
      }

      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommandInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommandInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput(savedInput);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // TODO: Implement tab completion
    }
  };

  const handleSessionChange = (sessionId: string) => {
    setActiveSessionId(sessionId);
    // Reset history when changing sessions
    setHistoryIndex(-1);
    setCommandInput('');
  };

  const handleCreateSession = () => {
    const newSession = TerminalService.createSession(`Terminal ${sessions.length + 1}`);
    setActiveSessionId(newSession.id);
  };

  const handleCloseSession = (sessionId: string) => {
    TerminalService.removeSession(sessionId);
    if (activeSessionId === sessionId) {
      setActiveSessionId(sessions.filter(s => s.id !== sessionId)[0]?.id || null);
    }
  };

  // Render timestamp in a readable format
  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className={cn('flex flex-col h-full bg-zinc-900 text-zinc-100 font-mono', className)}>
      <TerminalHeader
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSessionChange={handleSessionChange}
        onCreateSession={handleCreateSession}
        onCloseSession={handleCloseSession}
      />

      <div
        ref={terminalRef}
        className="flex-1 p-2 overflow-auto leading-relaxed"
        onClick={() => inputRef.current?.focus()}
      >
        {activeSession ? (
          activeSession.commands.length > 0 ? (
            <div className="space-y-1">
              {activeSession.commands.map((cmd) => (
                <div key={cmd.id}>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-xs">
                      {formatTimestamp(cmd.timestamp)}
                    </span>
                    <span className="text-cyan-500">
                      {activeSession.cwd}$
                    </span>
                    <span className="text-zinc-200">{cmd.command}</span>
                  </div>
                  {cmd.status === 'running' ? (
                    <div className="text-zinc-400 mt-1 flex items-center gap-2">
                      <LoaderCircle className="h-3 w-3 animate-spin" />
                      <span>Running...</span>
                    </div>
                  ) : (
                    cmd.output && (
                      <pre className={cn(
                        'mt-1 whitespace-pre-wrap text-sm font-mono',
                        cmd.status === 'error' ? 'text-red-400' : 'text-zinc-300'
                      )}>
                        {cmd.output}
                      </pre>
                    )
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-zinc-500 text-sm py-2">
              Terminal ready. Type commands and press Enter to execute.
            </div>
          )
        ) : (
          <div className="text-zinc-500 text-sm py-2">
            No terminal sessions available. Create a new session to start.
          </div>
        )}
      </div>

      {activeSession && (
        <form onSubmit={handleCommandSubmit} className="flex items-center p-2 border-t border-zinc-800">
          <span className="text-cyan-500 mr-2">{activeSession.cwd}$</span>
          <input
            ref={inputRef}
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isExecuting}
            className="flex-1 bg-transparent border-none outline-none text-zinc-100"
            placeholder={isExecuting ? 'Executing...' : 'Type command here...'}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
          />

          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="text-zinc-400 hover:text-zinc-100"
            disabled={isExecuting || !commandInput.trim()}
          >
            {isExecuting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              'Run'
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
