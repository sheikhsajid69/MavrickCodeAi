'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { type GitHubRepository, githubService } from '@/lib/github-service';
import { useEditorStore } from '@/lib/store';
import { GitHubAuthButton } from './auth-button';
import { RepoSelect } from './repo-select';
import { GitHubSaveDialog } from './save-dialog';
import { Download, Save, Github } from 'lucide-react';
import { toast } from 'sonner';

interface GitHubPanelProps {
  className?: string;
}

export function GitHubPanel({ className }: GitHubPanelProps) {
  const { fileSystem, activeFileId, setActiveFile } = useEditorStore();
  const [authState, setAuthState] = React.useState(githubService.getAuthState());
  const [selectedRepo, setSelectedRepo] = React.useState<GitHubRepository | null>(null);
  const [isSaveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  // Monitor auth state changes
  React.useEffect(() => {
    const checkAuthState = () => {
      setAuthState(githubService.getAuthState());
    };

    // Check every 5 seconds
    const interval = setInterval(checkAuthState, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleLoadRepository = async (owner: string, repo: string) => {
    setIsLoading(true);
    try {
      // Get repository details
      const repoDetails = await githubService.getRepository(owner, repo);
      setSelectedRepo(repoDetails);

      // Convert repository content to our file system
      const fileSystem = await githubService.convertRepoToFileSystem(owner, repo, repoDetails.default_branch);

      // Update our editor state with the repository content
      useEditorStore.setState({
        fileSystem: fileSystem,
        activeFileId: null,
        files: {}
      });

      // Process files to get them into the file record
      const processFiles = (items: any[], files: Record<string, any> = {}) => {
        for (const item of items) {
          if (!('children' in item)) {
            // It's a file
            files[item.id] = item;
          } else if (item.children?.length) {
            // It's a folder with children
            processFiles(item.children, files);
          }
        }
        return files;
      };

      // Update files state
      const filesDict = processFiles(fileSystem.root.children);
      useEditorStore.setState({ files: filesDict });

      // Set active file to first file
      const firstFileId = Object.keys(filesDict)[0];
      if (firstFileId) {
        setActiveFile(firstFileId);
      }

      toast.success(`Repository ${owner}/${repo} loaded successfully`);
    } catch (error) {
      console.error('Error loading repository:', error);
      toast.error('Failed to load repository');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between p-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Github size={16} className="text-zinc-400" />
          <span className="text-sm font-medium text-zinc-300">GitHub</span>
        </div>

        <GitHubAuthButton />
      </div>

      {authState.isAuthenticated ? (
        <>
          <RepoSelect onRepoLoad={handleLoadRepository} />

          {selectedRepo && (
            <div className="p-2 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{selectedRepo.name}</span>
                  <span className="text-xs text-zinc-500">{selectedRepo.owner.login}/{selectedRepo.name}</span>
                </div>

                <Button
                  variant="default"
                  size="sm"
                  className="bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
                  onClick={() => setSaveDialogOpen(true)}
                >
                  <Save size={14} className="mr-1" />
                  Save
                </Button>
              </div>
            </div>
          )}

          <GitHubSaveDialog
            open={isSaveDialogOpen}
            onOpenChange={setSaveDialogOpen}
            repository={selectedRepo || undefined}
            branch={selectedRepo?.default_branch}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 text-zinc-500">
          <Github size={24} className="mb-2" />
          <p className="text-sm">Sign in to GitHub to access your repositories</p>
        </div>
      )}
    </div>
  );
}
