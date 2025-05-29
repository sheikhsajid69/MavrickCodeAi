'use client';

import { type FileSystemType, FileType, type FolderType } from '@/types/editor';
import { createNewFile, createNewFolder } from './editor-utils';
import { toast } from 'sonner';

const API_BASE_URL = 'https://api.github.com';

export type GitHubRepository = {
  id: number;
  name: string;
  full_name: string;
  description: string;
  default_branch: string;
  visibility: string;
  html_url: string;
  owner: {
    login: string;
    avatar_url: string;
  };
};

export type GitHubFile = {
  path: string;
  type: 'file' | 'dir';
  sha: string;
  size?: number;
  content?: string;
  encoding?: string;
};

export type GitHubAuthState = {
  isAuthenticated: boolean;
  user: {
    username: string;
    avatarUrl: string;
  } | null;
  accessToken: string | null;
};

export type GitHubCommitPayload = {
  message: string;
  content: string;
  sha?: string;
  branch?: string;
};

export class GitHubService {
  private accessToken: string | null = null;
  private authState: GitHubAuthState = {
    isAuthenticated: false,
    user: null,
    accessToken: null,
  };

  constructor() {
    // Try to get the token from localStorage
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('github_access_token');
      const userData = localStorage.getItem('github_user_data');

      if (token) {
        this.accessToken = token;
        this.authState.accessToken = token;
        this.authState.isAuthenticated = true;

        if (userData) {
          try {
            this.authState.user = JSON.parse(userData);
          } catch (e) {
            console.error('Failed to parse user data', e);
          }
        }
      }
    }
  }

  getAuthState(): GitHubAuthState {
    return this.authState;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
    this.authState.accessToken = token;
    this.authState.isAuthenticated = true;

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('github_access_token', token);
    }
  }

  clearAccessToken(): void {
    this.accessToken = null;
    this.authState.accessToken = null;
    this.authState.isAuthenticated = false;
    this.authState.user = null;

    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('github_access_token');
      localStorage.removeItem('github_user_data');
    }
  }

  async getCurrentUser(): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user`, {
        headers: {
          'Authorization': `token ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const userData = await response.json();

      // Update auth state
      this.authState.user = {
        username: userData.login,
        avatarUrl: userData.avatar_url
      };

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('github_user_data', JSON.stringify(this.authState.user));
      }

      return userData;
    } catch (error) {
      console.error('Error fetching user data:', error);
      throw error;
    }
  }

  async getUserRepositories(): Promise<GitHubRepository[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user/repos?sort=updated&per_page=100`, {
        headers: {
          'Authorization': `token ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching repositories:', error);
      throw error;
    }
  }

  async getRepository(owner: string, repo: string): Promise<GitHubRepository> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching repository ${owner}/${repo}:`, error);
      throw error;
    }
  }

  async getRepositoryContent(
    owner: string,
    repo: string,
    path = '',
    branch = 'main'
  ): Promise<GitHubFile[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const url = path
        ? `${API_BASE_URL}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
        : `${API_BASE_URL}/repos/${owner}/${repo}/contents?ref=${branch}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching content for ${owner}/${repo}/${path}:`, error);
      throw error;
    }
  }

  async getFileContent(owner: string, repo: string, path: string, branch = 'main'): Promise<string> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
        headers: {
          'Authorization': `token ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      // GitHub returns base64 encoded content
      return this.decodeBase64(data.content);
    } catch (error) {
      console.error(`Error fetching file content for ${owner}/${repo}/${path}:`, error);
      throw error;
    }
  }

  async createOrUpdateFile(
    owner: string,
    repo: string,
    path: string,
    payload: GitHubCommitPayload
  ): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      // First encode content to base64
      const encodedContent = this.encodeBase64(payload.content);

      const requestBody = {
        message: payload.message,
        content: encodedContent,
        branch: payload.branch || 'main'
      };

      // If sha is provided (updating existing file)
      if (payload.sha) {
        requestBody['sha'] = payload.sha;
      }

      const response = await fetch(`${API_BASE_URL}/repos/${owner}/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error creating/updating file ${owner}/${repo}/${path}:`, error);
      throw error;
    }
  }

  async createRepository(name: string, description = '', isPrivate = false): Promise<GitHubRepository> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user/repos`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description,
          private: isPrivate,
          auto_init: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error creating repository ${name}:`, error);
      throw error;
    }
  }

  // Helpers to convert GitHub content to our file system structure
  async convertRepoToFileSystem(owner: string, repo: string, branch = 'main'): Promise<FileSystemType> {
    try {
      const rootContents = await this.getRepositoryContent(owner, repo, '', branch);
      const root = createNewFolder('root', '/');

      for (const item of rootContents) {
        await this.processGitHubItem(item, root, owner, repo, branch);
      }

      return { root };
    } catch (error) {
      console.error('Error converting repo to file system:', error);
      toast.error('Failed to load repository contents');
      throw error;
    }
  }

  private async processGitHubItem(
    item: GitHubFile,
    parentFolder: FolderType,
    owner: string,
    repo: string,
    branch: string
  ): Promise<void> {
    const path = `/${item.path}`;

    if (item.type === 'dir') {
      // Create folder
      const folder = createNewFolder(item.path.split('/').pop() || '', path);
      parentFolder.children.push(folder);

      // Load folder contents
      try {
        const contents = await this.getRepositoryContent(owner, repo, item.path, branch);
        for (const subItem of contents) {
          await this.processGitHubItem(subItem, folder, owner, repo, branch);
        }
      } catch (error) {
        console.error(`Error processing folder ${item.path}:`, error);
      }
    } else {
      // For files, fetch content
      try {
        const content = await this.getFileContent(owner, repo, item.path, branch);
        const file = createNewFile(item.path.split('/').pop() || '', path, content);
        file['sha'] = item.sha; // Store sha for future updates
        parentFolder.children.push(file);
      } catch (error) {
        console.error(`Error processing file ${item.path}:`, error);
        // Add file with empty content if we couldn't fetch it
        const file = createNewFile(item.path.split('/').pop() || '', path, '// Failed to load content');
        parentFolder.children.push(file);
      }
    }
  }

  private encodeBase64(str: string): string {
    return btoa(unescape(encodeURIComponent(str)));
  }

  private decodeBase64(str: string): string {
    return decodeURIComponent(escape(atob(str.replace(/\s/g, ''))));
  }
}

// Export a singleton instance
export const githubService = new GitHubService();
