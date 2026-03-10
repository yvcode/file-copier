import { useState, useEffect, useCallback } from 'react';
import type { FileItem } from '../types';

export function useDirectoryReader(onItemsLoaded: (items: FileItem[]) => void) {
    const [currentPath, setCurrentPath] = useState<string>('');
    const [items, setItems] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [dirError, setDirError] = useState<string | null>(null);

    const loadDirectory = useCallback((path: string) => {
        if (!path || !(window as any).ipcRenderer) return;
        setLoading(true);
        setDirError(null);
        (window as any).ipcRenderer.readDir(path).then((res: FileItem[]) => {
            res.sort((a, b) => {
                if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
                return a.isDirectory ? -1 : 1;
            });
            setItems(res);
            onItemsLoaded(res);
            setLoading(false);
        }).catch((err: any) => {
            console.error('Failed to read directory:', err);
            setItems([]);
            setLoading(false);
            setDirError(`Failed to read "${path}". The drive may be disconnected, corrupted, or you may not have permission.`);
        });
    }, [onItemsLoaded]);

    useEffect(() => {
        if (currentPath) {
            loadDirectory(currentPath);
        }
    }, [currentPath, loadDirectory]);

    const navigateUp = useCallback(() => {
        let parts = currentPath.split(/\\|\//).filter(Boolean);
        if (parts.length > 1) {
            if (parts.length === 2 && parts[0].endsWith(':')) {
                setCurrentPath(parts[0] + '\\');
            } else {
                parts.pop();
                setCurrentPath(parts.join('\\'));
            }
        } else if (parts.length === 1 && parts[0].endsWith(':')) {
            setCurrentPath(parts[0] + '\\');
        }
    }, [currentPath]);

    const retryCurrentDirectory = useCallback(() => {
        loadDirectory(currentPath);
    }, [currentPath, loadDirectory]);

    return {
        currentPath,
        setCurrentPath,
        items,
        loading,
        dirError,
        navigateUp,
        retryCurrentDirectory
    };
}
