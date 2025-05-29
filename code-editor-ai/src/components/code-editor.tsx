'use client';

import * as React from 'react';
import { Editor } from '@monaco-editor/react';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  className?: string;
}

export function CodeEditor({ className }: CodeEditorProps) {
  const { activeFileId, files, updateFileContent, theme } = useEditorStore();
  const activeFile = activeFileId ? files[activeFileId] : null;

  const handleEditorChange = (value: string | undefined) => {
    if (activeFileId && value !== undefined) {
      updateFileContent(activeFileId, value);
    }
  };

  if (!activeFile) {
    return (
      <div className={cn('flex items-center justify-center h-full bg-zinc-900 text-zinc-500', className)}>
        <div className="text-center">
          <p>No file selected</p>
          <p className="text-sm mt-2">Select a file from the explorer or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('h-full', className)}>
      <Editor
        height="100%"
        theme={theme === 'dark' ? 'vs-dark' : 'vs'}
        language={activeFile.language}
        value={activeFile.content}
        onChange={handleEditorChange}
        options={{
          fontSize: 14,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          fontFamily: 'JetBrains Mono, monospace',
          fontLigatures: true,
          smoothScrolling: true,
          cursorSmoothCaretAnimation: 'on',
          padding: { top: 10 },
        }}
      />
    </div>
  );
}
