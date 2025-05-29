'use client';

import { v4 as uuidv4 } from 'uuid';
import type { FileType, FolderType, Language } from '@/types/editor';

export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
};

export const getLanguageFromFilename = (filename: string): Language => {
  const extension = getFileExtension(filename).toLowerCase();

  switch (extension) {
    case 'js':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'jsx':
      return 'jsx';
    case 'tsx':
      return 'tsx';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    default:
      return 'javascript';
  }
};

export const createNewFile = (
  name: string,
  path: string,
  content = ''
): FileType => {
  return {
    id: uuidv4(),
    name,
    content,
    language: getLanguageFromFilename(name),
    path,
  };
};

export const createNewFolder = (
  name: string,
  path: string,
  children: (FileType | FolderType)[] = []
): FolderType => {
  return {
    id: uuidv4(),
    name,
    path,
    children,
    isExpanded: true,
  };
};

export const getFileOrFolderByPath = (
  root: FolderType,
  path: string
): FileType | FolderType | null => {
  if (root.path === path) {
    return root;
  }

  for (const child of root.children) {
    if (child.path === path) {
      return child;
    }

    if ('children' in child) {
      const found = getFileOrFolderByPath(child, path);
      if (found) {
        return found;
      }
    }
  }

  return null;
};

export const addFileToFolder = (
  root: FolderType,
  folderPath: string,
  file: FileType | FolderType
): FolderType => {
  if (root.path === folderPath) {
    return {
      ...root,
      children: [...root.children, file],
    };
  }

  return {
    ...root,
    children: root.children.map((child) => {
      if ('children' in child && child.path.startsWith(folderPath)) {
        return addFileToFolder(child, folderPath, file);
      }
      return child;
    }),
  };
};

export const deleteFileOrFolder = (
  root: FolderType,
  path: string
): FolderType => {
  return {
    ...root,
    children: root.children.filter((child) => child.path !== path).map((child) => {
      if ('children' in child) {
        return deleteFileOrFolder(child, path);
      }
      return child;
    }),
  };
};

export const getInitialFileSystem = (): FolderType => {
  return createNewFolder('root', '/', [
    createNewFile('index.html', '/index.html', '<html>\n  <head>\n    <title>My App</title>\n    <link rel="stylesheet" href="styles.css">\n  </head>\n  <body>\n    <div id="app"></div>\n    <script src="app.js"></script>\n  </body>\n</html>'),
    createNewFile('styles.css', '/styles.css', 'body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n}\n\n#app {\n  background-color: #f5f5f5;\n  border-radius: 5px;\n  padding: 20px;\n}'),
    createNewFile('app.js', '/app.js', '// Main application code\ndocument.addEventListener("DOMContentLoaded", () => {\n  const appElement = document.getElementById("app");\n  appElement.innerHTML = "<h1>Hello, World!</h1>";\n});'),
  ]);
};
