'use client';

import * as React from 'react';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EyeIcon, EyeOffIcon, TerminalIcon, Save, Maximize, Sun, Moon } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { AIProvider } from '@/types/editor';

interface ToolbarProps {
  className?: string;
  onOpenAiPanel?: () => void;
  aiProvider: AIProvider;
  onAiProviderChange: (provider: AIProvider) => void;
}

export function Toolbar({ className, onOpenAiPanel, aiProvider, onAiProviderChange }: ToolbarProps) {
  const { activeFileId, files, togglePreview, showPreview, theme, setTheme } = useEditorStore();
  const activeFile = activeFileId ? files[activeFileId] : null;

  return (
    <div className={cn('flex items-center gap-2 p-2 bg-zinc-800 border-b border-zinc-700', className)}>
      <div className="flex items-center gap-2 mr-auto">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-zinc-700"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-300 hover:text-white hover:bg-zinc-700"
          onClick={() => togglePreview()}
          title={showPreview ? 'Hide preview' : 'Show preview'}
        >
          {showPreview ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </Button>

        <Separator orientation="vertical" className="h-6 bg-zinc-700" />

        {activeFile && (
          <>
            <span className="text-sm text-zinc-300">
              {activeFile.name}
            </span>

            <span className="text-xs px-2 py-1 rounded bg-zinc-700 text-zinc-300 uppercase">
              {activeFile.language}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Tabs defaultValue={aiProvider} onValueChange={(value) => onAiProviderChange(value as AIProvider)}>
          <TabsList className="bg-zinc-700">
            <TabsTrigger value="openai" className="data-[state=active]:bg-zinc-600">OpenAI</TabsTrigger>
            <TabsTrigger value="xai" className="data-[state=active]:bg-zinc-600">xAI</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button
          variant="default"
          size="sm"
          className="bg-zinc-700 hover:bg-zinc-600"
          onClick={onOpenAiPanel}
        >
          <TerminalIcon size={16} className="mr-1" />
          AI Assistant
        </Button>
      </div>
    </div>
  );
}
