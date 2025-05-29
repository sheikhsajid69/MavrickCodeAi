'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Github } from 'lucide-react';
import { githubService } from '@/lib/github-service';
import { toast } from 'sonner';

export function GitHubAuthButton() {
  const [authState, setAuthState] = React.useState(githubService.getAuthState());
  const [isLoggingIn, setIsLoggingIn] = React.useState(false);

  React.useEffect(() => {
    // Check if we are in the OAuth callback
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const token = hash.split('&')[0].split('=')[1];
        if (token) {
          handleLogin(token);

          // Clean up the URL
          const cleanUrl = window.location.href.split('#')[0];
          window.history.replaceState({}, document.title, cleanUrl);
        }
      }
    }
  }, []);

  const handleLogin = async (token?: string) => {
    setIsLoggingIn(true);
    try {
      if (token) {
        githubService.setAccessToken(token);
      }

      await githubService.getCurrentUser();
      setAuthState(githubService.getAuthState());
      toast.success('Successfully logged in to GitHub');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to log in to GitHub');

      // Clear token if it's invalid
      githubService.clearAccessToken();
    } finally {
      setIsLoggingIn(false);
    }
  };

  const initiateGitHubLogin = () => {
    if (typeof window !== 'undefined') {
      const clientId = 'YOUR_GITHUB_CLIENT_ID'; // Replace with your GitHub OAuth App client ID
      const redirectUri = encodeURIComponent(window.location.href);
      const scope = 'repo';

      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

      // For demo purposes, since we can't complete the OAuth flow
      // we'll simulate a token
      const simulatedToken = 'simulated_github_token_' + Math.random().toString(36).substring(7);
      handleLogin(simulatedToken);

      // In a real app, you would use this to redirect to GitHub:
      // window.location.href = githubAuthUrl;
    }
  };

  const handleLogout = () => {
    githubService.clearAccessToken();
    setAuthState(githubService.getAuthState());
    toast.success('Logged out of GitHub');
  };

  return (
    <>
      {authState.isAuthenticated ? (
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="gap-2 text-zinc-300 hover:text-white hover:bg-zinc-700"
          disabled={isLoggingIn}
        >
          <Github size={16} />
          {authState.user?.username || 'GitHub'}
          <LogOut size={16} />
        </Button>
      ) : (
        <Button
          variant="ghost"
          onClick={initiateGitHubLogin}
          className="gap-2 text-zinc-300 hover:text-white hover:bg-zinc-700"
          disabled={isLoggingIn}
        >
          <Github size={16} />
          Login with GitHub
          <LogIn size={16} />
        </Button>
      )}
    </>
  );
}
