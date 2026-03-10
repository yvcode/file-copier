// Shared types for the file copier application

export interface FileItem {
    name: string;
    isDirectory: boolean;
    path: string;
    size: number;
}

export interface FailedFile {
    path: string;
    error: string;
}

export interface TreeNode {
    name: string;
    fullPath: string;
    children: Map<string, TreeNode>;
    isLeaf: boolean;
    item?: FileItem;
}

export type CopyState = 'preview' | 'copying' | 'done';
export type CopyPhase = 'counting' | 'copying' | 'done';
