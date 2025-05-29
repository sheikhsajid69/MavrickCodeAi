export type Language =
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css'
  | 'json'
  | 'markdown'
  | 'python'
  | 'jsx'
  | 'tsx';

export type FileType = {
  id: string;
  name: string;
  content: string;
  language: Language;
  path: string;
};

export type FolderType = {
  id: string;
  name: string;
  path: string;
  children: (FileType | FolderType)[];
  isExpanded?: boolean;
};

export type FileSystemType = {
  root: FolderType;
};

export type EditorState = {
  activeFileId: string | null;
  files: Record<string, FileType>;
  fileSystem: FileSystemType;
  splitPosition: number;
  showPreview: boolean;
  theme: 'dark' | 'light';
};

export type AIProvider = 'openai' | 'xai';

export type AIResponse = {
  text: string;
  suggestedCode?: string;
};

export type AIRequest = {
  provider: AIProvider;
  prompt: string;
  code?: string;
  language?: Language;
};
