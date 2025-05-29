'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type GitHubRepository, githubService } from '@/lib/github-service';
import { useEditorStore } from '@/lib/store';
import { FileType } from '@/types/editor';
import { LoaderCircle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repository?: GitHubRepository;
  branch?: string;
}

export function GitHubSaveDialog({ open, onOpenChange, repository, branch = 'main' }: SaveDialogProps) {
  const { files } = useEditorStore();
  const [commitMessage, setCommitMessage] = React.useState('');
  const [isSaving, setIsSaving] = React.useState(false);
  const [results, setResults] = React.useState<{
    file: string;
    status: 'pending' | 'success' | 'error';
    message?: string;
  }[]>([]);

  React.useEffect(() => {
    if (open) {
      // Generate default commit message
      const date = new Date().toISOString().split('T')[0];
      setCommitMessage(`Update code - ${date}`);

      // Reset results
      setResults([]);
    }
  }, [open]);

  const handleSave = async () => {
    if (!repository) {
      toast.error('No repository selected');
      return;
    }

    if (!commitMessage.trim()) {
      toast.error('Please enter a commit message');
      return;
    }

    setIsSaving(true);

    // Initialize results for each file
    const initialResults = Object.values(files).map(file => ({
      file: file.path,
      status: 'pending' as const
    }));
    setResults(initialResults);

    try {
      const owner = repository.owner.login;
      const repo = repository.name;

      // Save each file one by one
      for (let i = 0; i < initialResults.length; i++) {
        const file = Object.values(files).find(f => f.path === initialResults[i].file);
        if (!file) continue;

        try {
          // Remove the leading slash for GitHub API
          const path = file.path.startsWith('/') ? file.path.substring(1) : file.path;

          // Get the sha if this file has it (for updates)
          const sha = (file as any).sha;

          await githubService.createOrUpdateFile(owner, repo, path, {
            message: commitMessage,
            content: file.content,
            sha,
            branch
          });

          // Update result
          setResults(prev =>
            prev.map(res =>
              res.file === file.path
                ? { ...res, status: 'success' }
                : res
            )
          );
        } catch (error) {
          console.error(`Error saving file ${file.path}:`, error);

          // Update result
          setResults(prev =>
            prev.map(res =>
              res.file === file.path
                ? {
                    ...res,
                    status: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error'
                  }
                : res
            )
          );
        }

        // Small delay between API calls to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Check if all files were saved successfully
      const allSuccess = results.every(res => res.status === 'success');
      if (allSuccess) {
        toast.success('All files saved to GitHub successfully');
      } else {
        const errorCount = results.filter(res => res.status === 'error').length;
        toast.error(`Failed to save ${errorCount} files. See details in the dialog.`);
      }
    } catch (error) {
      console.error('Error during save operation:', error);
      toast.error('An error occurred while saving to GitHub');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <LoaderCircle className="h-4 w-4 animate-spin text-zinc-400" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 text-zinc-100 border-zinc-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle>Save to GitHub</DialogTitle>
          <DialogDescription>
            {repository
              ? `Save your files to ${repository.full_name} (${branch} branch)`
              : 'Please select a repository first'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="commit-message">Commit Message</Label>
            <Textarea
              id="commit-message"
              placeholder="Describe your changes"
              className="bg-zinc-800 border-zinc-700"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              disabled={isSaving}
            />
          </div>

          {results.length > 0 && (
            <div className="border border-zinc-800 rounded-md overflow-hidden">
              <div className="bg-zinc-800 px-4 py-2 font-medium text-sm">Files</div>
              <div className="divide-y divide-zinc-800">
                {results.map((result) => (
                  <div key={result.file} className="px-4 py-2 flex items-center text-sm">
                    <span className="mr-2">{getStatusIcon(result.status)}</span>
                    <span className="flex-1 truncate">{result.file}</span>
                    {result.status === 'error' && (
                      <span className="text-xs text-red-400 truncate max-w-[300px]">
                        {result.message}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !repository || !commitMessage.trim()}
            className="bg-zinc-700 hover:bg-zinc-600"
          >
            {isSaving ? 'Saving...' : 'Save to GitHub'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
