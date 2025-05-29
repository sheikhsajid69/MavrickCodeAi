'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { FileExplorer } from './file-explorer';
import { CodeEditor } from './code-editor';
import { Preview } from './preview';
import { Toolbar } from './toolbar';
import { AIAssistant } from './ai-assistant';
import { Toaster } from '@/components/ui/toaster';
import type { AIProvider } from '@/types/editor';

// Dynamically import Split to avoid SSR issues
const Split = dynamic(() => import('react-split'), { ssr: false });

interface EditorLayoutProps {
  className?: string;
}

export function EditorLayout({ className }: EditorLayoutProps) {
  const { splitPosition, setSplitPosition, showPreview } = useEditorStore();
  const [showAiPanel, setShowAiPanel] = React.useState(false);
  const [aiProvider, setAiProvider] = React.useState<AIProvider>('openai');

  return (
    <div className={cn('flex flex-col h-screen bg-zinc-900', className)}>
      <Toolbar
        className="shrink-0"
        onOpenAiPanel={() => setShowAiPanel(true)}
        aiProvider={aiProvider}
        onAiProviderChange={setAiProvider}
      />

      <div className="flex-1 flex overflow-hidden">
        <FileExplorer className="w-64 shrink-0" />

        <div className="flex-1 overflow-hidden">
          {showPreview ? (
            <Split
              className="flex h-full"
              direction="horizontal"
              sizes={[splitPosition, 100 - splitPosition]}
              minSize={20}
              expandToMin={false}
              gutterSize={4}
              gutterAlign="center"
              snapOffset={30}
              dragInterval={1}
              onDragEnd={(sizes) => {
                setSplitPosition(sizes[0]);
              }}
              gutter={() => {
                const element = document.createElement('div');
                element.className = 'bg-zinc-700 hover:bg-zinc-600 w-1 h-full cursor-col-resize';
                return element;
              }}
            >
              <CodeEditor className="h-full" />
              <Preview className="h-full" />
            </Split>
          ) : (
            <CodeEditor className="h-full" />
          )}
        </div>

        {showAiPanel && (
          <AIAssistant
            className="w-96 shrink-0"
            provider={aiProvider}
            onClose={() => setShowAiPanel(false)}
          />
        )}
      </div>

      <Toaster />
    </div>
  );
}
