'use client';

import * as React from 'react';
import type { FolderType, FileType } from '@/types/editor';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronDown, File, Folder, Plus, X, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface FileExplorerProps {
  className?: string;
}

export function FileExplorer({ className }: FileExplorerProps) {
  const { fileSystem, activeFileId, files, setActiveFile, createFile, createFolder, deleteFile, deleteFolder } = useEditorStore();
  const [newItemDialogOpen, setNewItemDialogOpen] = React.useState(false);
  const [newItemType, setNewItemType] = React.useState<'file' | 'folder'>('file');
  const [newItemName, setNewItemName] = React.useState('');
  const [currentPath, setCurrentPath] = React.useState('/');

  const handleCreateNewItem = () => {
    if (newItemName.trim() === '') return;

    if (newItemType === 'file') {
      const fileId = createFile(newItemName, currentPath);
      setActiveFile(fileId);
    } else {
      createFolder(newItemName, currentPath);
    }

    setNewItemDialogOpen(false);
    setNewItemName('');
  };

  const renderFileSystemItem = (item: FileType | FolderType, level = 0) => {
    const isFolder = 'children' in item;
    const isActive = !isFolder && activeFileId === item.id;
    const marginLeft = level * 12;

    if (isFolder) {
      const folder = item as FolderType;
      const isExpanded = folder.isExpanded;

      return (
        <div key={folder.id}>
          <div
            className={cn(
              'flex items-center gap-1 py-1 px-2 hover:bg-zinc-800 cursor-pointer text-sm',
              folder.path === '/' ? 'font-semibold' : ''
            )}
            style={{ marginLeft: folder.path === '/' ? 0 : marginLeft }}
            onClick={() => {
              // Toggle folder expand/collapse
              folder.isExpanded = !folder.isExpanded;
            }}
          >
            <span className="mr-1">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
            <span className="mr-1">
              {isExpanded ? <FolderOpen size={16} /> : <Folder size={16} />}
            </span>
            <span className="flex-grow truncate">{folder.name}</span>

            {folder.path !== '/' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                    <Plus size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setNewItemType('file');
                    setCurrentPath(folder.path);
                    setNewItemDialogOpen(true);
                  }}>
                    New File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    setNewItemType('folder');
                    setCurrentPath(folder.path);
                    setNewItemDialogOpen(true);
                  }}>
                    New Folder
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => {
                    e.stopPropagation();
                    deleteFolder(folder.path);
                  }}>
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isExpanded && (
            <div>
              {folder.children.map((child) => renderFileSystemItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    const file = item as FileType;

    return (
      <div
        key={file.id}
        className={cn(
          'flex items-center group gap-1 py-1 px-2 hover:bg-zinc-800 cursor-pointer text-sm',
          isActive ? 'bg-zinc-800 text-white' : 'text-zinc-300'
        )}
        style={{ marginLeft }}
        onClick={() => setActiveFile(file.id)}
      >
        <span className="mr-1 opacity-70">
          <File size={16} />
        </span>
        <span className="flex-grow truncate">{file.name}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            deleteFile(file.path);
          }}
        >
          <X size={14} />
        </Button>
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full bg-zinc-900 text-zinc-100', className)}>
      <div className="flex items-center justify-between p-2 border-b border-zinc-800">
        <h3 className="text-sm font-semibold">Files</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => {
              setNewItemType('file');
              setCurrentPath('/');
              setNewItemDialogOpen(true);
            }}>
              New File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setNewItemType('folder');
              setCurrentPath('/');
              setNewItemDialogOpen(true);
            }}>
              New Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 overflow-auto">
        {renderFileSystemItem(fileSystem.root)}
      </div>

      <Dialog open={newItemDialogOpen} onOpenChange={setNewItemDialogOpen}>
        <DialogContent className="bg-zinc-900 text-zinc-100 border-zinc-800">
          <DialogHeader>
            <DialogTitle>Create New {newItemType === 'file' ? 'File' : 'Folder'}</DialogTitle>
            <DialogDescription>
              Enter a name for the new {newItemType}.
            </DialogDescription>
          </DialogHeader>

          <Input
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder={`Enter ${newItemType} name`}
            className="bg-zinc-800 border-zinc-700"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateNewItem();
              }
            }}
          />

          <DialogFooter>
            <Button
              variant="default"
              onClick={handleCreateNewItem}
              className="bg-zinc-800 hover:bg-zinc-700"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
