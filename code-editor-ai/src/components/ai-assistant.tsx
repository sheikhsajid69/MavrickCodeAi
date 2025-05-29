'use client';

import * as React from 'react';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, X, Loader2, Code, Copy, Check } from 'lucide-react';
import type { AIProvider, AIResponse } from '@/types/editor';

interface AIAssistantProps {
  className?: string;
  provider: AIProvider;
  onClose: () => void;
}

export function AIAssistant({ className, provider, onClose }: AIAssistantProps) {
  const { activeFileId, files, updateFileContent } = useEditorStore();
  const activeFile = activeFileId ? files[activeFileId] : null;

  const [prompt, setPrompt] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [response, setResponse] = React.useState<AIResponse | null>(null);
  const [copied, setCopied] = React.useState(false);

  const handleSubmit = async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);

    // In a real application, this would send a request to the AI provider API
    // For this demo, we'll simulate a response

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock response based on prompt
    const mockResponse: AIResponse = {
      text: `Here's a suggested solution for "${prompt}":`,
      suggestedCode: activeFile ?
        `// Generated code for ${activeFile.name}\n// Based on your prompt: "${prompt}"\n\n// Example code\nfunction hello() {\n  console.log("Hello from ${provider}");\n  return "This is AI generated code";\n}`
        : undefined
    };

    setResponse(mockResponse);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = () => {
    if (response?.suggestedCode) {
      navigator.clipboard.writeText(response.suggestedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const applyToEditor = () => {
    if (activeFileId && response?.suggestedCode) {
      updateFileContent(activeFileId, response.suggestedCode);
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-zinc-900 text-white border-l border-zinc-700', className)}>
      <div className="flex items-center justify-between p-3 border-b border-zinc-800">
        <h3 className="text-sm font-semibold">
          AI Assistant ({provider === 'openai' ? 'OpenAI' : 'xAI'})
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-zinc-800"
          onClick={onClose}
        >
          <X size={18} />
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {response ? (
          <div className="space-y-4">
            <div className="bg-zinc-800 p-3 rounded">
              <p className="text-sm text-zinc-300 mb-2">{response.text}</p>

              {response.suggestedCode && (
                <div className="relative">
                  <pre className="bg-zinc-950 p-3 rounded text-sm overflow-auto max-h-[400px]">
                    <code className="text-zinc-300">{response.suggestedCode}</code>
                  </pre>

                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-zinc-800/50 hover:bg-zinc-700"
                      onClick={copyToClipboard}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-zinc-800/50 hover:bg-zinc-700"
                      onClick={applyToEditor}
                      disabled={!activeFileId}
                      title={activeFileId ? "Apply to current file" : "No file selected"}
                    >
                      <Code size={14} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <p>Ask the AI assistant for help with your code</p>
              <p className="text-sm mt-1">Example: "Create a React component for a counter"</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-zinc-800">
        <div className="relative">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the AI assistant..."
            className="resize-none bg-zinc-800 border-zinc-700 pr-10"
            rows={3}
            disabled={isLoading}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700"
            onClick={handleSubmit}
            disabled={isLoading || !prompt.trim()}
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
