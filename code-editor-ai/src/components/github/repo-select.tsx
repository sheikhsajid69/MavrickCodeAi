'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { type GitHubRepository, githubService } from '@/lib/github-service';
import { useEditorStore } from '@/lib/store';
import { GitFork, Search, GitBranchPlus, RefreshCw, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';

interface RepoSelectProps {
  onRepoLoad: (owner: string, repo: string) => void;
}

export function RepoSelect({ onRepoLoad }: RepoSelectProps) {
  const [repos, setRepos] = React.useState<GitHubRepository[]>([]);
  const [filteredRepos, setFilteredRepos] = React.useState<GitHubRepository[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [newRepoName, setNewRepoName] = React.useState('');
  const [newRepoDesc, setNewRepoDesc] = React.useState('');
  const [isPrivate, setIsPrivate] = React.useState(false);

  const authState = githubService.getAuthState();

  const loadRepos = React.useCallback(async () => {
    if (!authState.isAuthenticated) return;

    setIsLoading(true);
    try {
      const userRepos = await githubService.getUserRepositories();
      setRepos(userRepos);
      setFilteredRepos(userRepos);
    } catch (error) {
      console.error('Error loading repositories:', error);
      toast.error('Failed to load your repositories');
    } finally {
      setIsLoading(false);
    }
  }, [authState.isAuthenticated]);

  React.useEffect(() => {
    if (authState.isAuthenticated) {
      loadRepos();
    }
  }, [authState.isAuthenticated, loadRepos]);

  React.useEffect(() => {
    if (searchTerm) {
      const filtered = repos.filter(repo =>
        repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredRepos(filtered);
    } else {
      setFilteredRepos(repos);
    }
  }, [searchTerm, repos]);

  const handleCreateRepo = async () => {
    if (!newRepoName.trim()) {
      toast.error('Repository name is required');
      return;
    }

    setIsLoading(true);
    try {
      const newRepo = await githubService.createRepository(
        newRepoName.trim(),
        newRepoDesc.trim(),
        isPrivate
      );

      toast.success(`Repository ${newRepo.full_name} created successfully`);
      setShowCreateDialog(false);

      // Reset form
      setNewRepoName('');
      setNewRepoDesc('');
      setIsPrivate(false);

      // Refresh repos list
      await loadRepos();
    } catch (error) {
      console.error('Error creating repository:', error);
      toast.error('Failed to create repository');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepoSelect = (repo: GitHubRepository) => {
    const [owner, repoName] = repo.full_name.split('/');
    onRepoLoad(owner, repoName);
  };

  if (!authState.isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 p-2 border-t border-zinc-800">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search repositories..."
            className="pl-8 bg-zinc-800 border-zinc-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-zinc-400 hover:text-white"
          onClick={loadRepos}
          disabled={isLoading}
        >
          {isLoading ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-zinc-400 hover:text-white"
            >
              <GitBranchPlus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 text-zinc-100 border-zinc-800">
            <DialogHeader>
              <DialogTitle>Create New Repository</DialogTitle>
              <DialogDescription>
                Create a new GitHub repository to save your code.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="repo-name">Repository Name</Label>
                <Input
                  id="repo-name"
                  placeholder="my-awesome-project"
                  className="bg-zinc-800 border-zinc-700"
                  value={newRepoName}
                  onChange={(e) => setNewRepoName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="repo-desc">Description (optional)</Label>
                <Input
                  id="repo-desc"
                  placeholder="A brief description of your project"
                  className="bg-zinc-800 border-zinc-700"
                  value={newRepoDesc}
                  onChange={(e) => setNewRepoDesc(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="repo-private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="mr-2"
                />
                <Label htmlFor="repo-private">Private repository</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="default"
                onClick={handleCreateRepo}
                disabled={isLoading || !newRepoName.trim()}
                className="bg-zinc-800 hover:bg-zinc-700"
              >
                {isLoading ? 'Creating...' : 'Create Repository'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-2 overflow-auto max-h-64">
        {isLoading && filteredRepos.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-zinc-500">
            <LoaderCircle className="animate-spin mr-2 h-4 w-4" />
            <span>Loading repositories...</span>
          </div>
        ) : filteredRepos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-zinc-500">
            <span>No repositories found</span>
            <Button
              variant="link"
              onClick={() => setShowCreateDialog(true)}
              className="text-zinc-400 hover:text-zinc-300 mt-2"
            >
              Create a new repository
            </Button>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredRepos.map((repo) => (
              <Button
                key={repo.id}
                variant="ghost"
                className="justify-start gap-2 py-2 px-4 text-left text-zinc-300 hover:bg-zinc-800"
                onClick={() => handleRepoSelect(repo)}
              >
                <GitFork size={16} className="text-zinc-400" />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{repo.name}</span>
                  {repo.description && (
                    <span className="text-xs text-zinc-500 truncate max-w-[240px]">
                      {repo.description}
                    </span>
                  )}
                </div>
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
