'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { type EditorState, type FileType, type FolderType, Language } from '@/types/editor';
import {
  getInitialFileSystem,
  createNewFile,
  createNewFolder,
  addFileToFolder,
  deleteFileOrFolder
} from './editor-utils';

interface EditorStore extends EditorState {
  // File operations
  setActiveFile: (fileId: string | null) => void;
  createFile: (name: string, parentPath: string, content?: string) => string;
  createFolder: (name: string, parentPath: string) => string;
  updateFileContent: (fileId: string, content: string) => void;
  deleteFile: (path: string) => void;
  deleteFolder: (path: string) => void;

  // Editor settings
  setSplitPosition: (position: number) => void;
  togglePreview: () => void;
  setTheme: (theme: 'dark' | 'light') => void;
}

const initialFileSystem = getInitialFileSystem();
const initialFiles: Record<string, FileType> = {};

// Convert initial files to record format
const processFileSystem = (children: (FileType | FolderType)[]) => {
  for (const child of children) {
    if (!('children' in child)) {
      initialFiles[child.id] = child;
    } else if (child.children && child.children.length > 0) {
      processFileSystem(child.children);
    }
  }
};

processFileSystem(initialFileSystem.children);

// Set initial active file (first file in system)
const initialActiveFileId = initialFileSystem.children.find(
  (child) => !('children' in child)
)?.id || null;

export const useEditorStore = create<EditorStore>((set) => ({
  // Initial state
  activeFileId: initialActiveFileId,
  files: initialFiles,
  fileSystem: { root: initialFileSystem },
  splitPosition: 50,
  showPreview: true,
  theme: 'dark',

  // File operations
  setActiveFile: (fileId) => set({ activeFileId: fileId }),

  createFile: (name, parentPath, content = '') => {
    const newFile = createNewFile(name, `${parentPath}/${name}`, content);

    set((state) => {
      const updatedRoot = addFileToFolder(
        state.fileSystem.root,
        parentPath,
        newFile
      );

      return {
        files: {
          ...state.files,
          [newFile.id]: newFile,
        },
        fileSystem: {
          root: updatedRoot,
        },
      };
    });

    return newFile.id;
  },

  createFolder: (name, parentPath) => {
    const path = `${parentPath}/${name}`;
    const newFolder = createNewFolder(name, path);
    const folderId = newFolder.id;

    set((state) => {
      const updatedRoot = addFileToFolder(
        state.fileSystem.root,
        parentPath,
        newFolder
      );

      return {
        fileSystem: {
          root: updatedRoot,
        },
      };
    });

    return folderId;
  },

  updateFileContent: (fileId, content) => {
    set((state) => ({
      files: {
        ...state.files,
        [fileId]: {
          ...state.files[fileId],
          content,
        },
      },
    }));
  },

  deleteFile: (path) => {
    set((state) => {
      const updatedRoot = deleteFileOrFolder(state.fileSystem.root, path);
      const fileId = Object.values(state.files).find(
        (file) => file.path === path
      )?.id;

      if (!fileId) {
        return { fileSystem: { root: updatedRoot } };
      }

      const updatedFiles = { ...state.files };
      delete updatedFiles[fileId];

      const newActiveFileId =
        state.activeFileId === fileId
          ? Object.keys(updatedFiles)[0] || null
          : state.activeFileId;

      return {
        activeFileId: newActiveFileId,
        files: updatedFiles,
        fileSystem: { root: updatedRoot },
      };
    });
  },

  deleteFolder: (path) => {
    set((state) => {
      const updatedRoot = deleteFileOrFolder(state.fileSystem.root, path);

      // Remove all files contained in the folder
      const updatedFiles = { ...state.files };
      let newActiveFileId = state.activeFileId;

      for (const [id, file] of Object.entries(state.files)) {
        if (file.path.startsWith(path)) {
          delete updatedFiles[id];
          if (id === state.activeFileId) {
            newActiveFileId = null;
          }
        }
      }

      return {
        activeFileId: newActiveFileId,
        files: updatedFiles,
        fileSystem: { root: updatedRoot },
      };
    });
  },

  // Editor settings
  setSplitPosition: (position) => set({ splitPosition: position }),
  togglePreview: () => set((state) => ({ showPreview: !state.showPreview })),
  setTheme: (theme) => set({ theme }),
}));
