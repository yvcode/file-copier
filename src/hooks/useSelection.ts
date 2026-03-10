import { useState, useEffect, useCallback } from 'react';
import type { FileItem } from '../types';

export function useSelection(
    selectedPaths: Set<string>,
    setSelectedPaths: (paths: Set<string>) => void,
    onItemsLoaded: (items: FileItem[]) => void
) {
    const [actionError, setActionError] = useState<string | null>(null);

    // Auto-dismiss action errors
    useEffect(() => {
        if (actionError) {
            const timer = setTimeout(() => setActionError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [actionError]);

    const toggleSelection = useCallback(async (item: FileItem, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        const newSelection = new Set(selectedPaths);

        if (!item.isDirectory) {
            // Flat file toggle
            if (newSelection.has(item.path)) {
                newSelection.delete(item.path);
            } else {
                newSelection.add(item.path);
            }
        } else {
            // Folder toggle
            const isPartiallySelected = Array.from(newSelection).some(
                p => p.startsWith(item.path + '\\') || p.startsWith(item.path + '/')
            );

            if (isPartiallySelected) {
                // Deselect entire folder by removing all descendants
                for (const p of Array.from(newSelection)) {
                    if (p.startsWith(item.path + '\\') || p.startsWith(item.path + '/')) {
                        newSelection.delete(p);
                    }
                }
            } else {
                // Fetch and select ALL files recursively
                try {
                    // Set loading state if needed via external mechanism, but for now just await
                    const recursiveFiles: FileItem[] = await (window as any).ipcRenderer.walkDirRecursive(item.path);

                    if (recursiveFiles.length === 0) {
                        setActionError(`Folder "${item.name}" is empty or unreadable.`);
                    } else {
                        onItemsLoaded(recursiveFiles); // Cache them
                        for (const child of recursiveFiles) {
                            if (!child.isDirectory) { // Safety check, walk-dir-recursive should only return files
                                newSelection.add(child.path);
                            }
                        }
                    }
                } catch (err: any) {
                    setActionError(`Failed to read folder "${item.name}": ${err?.message || 'Access Denied.'}`);
                }
            }
        }
        setSelectedPaths(newSelection);
    }, [selectedPaths, setSelectedPaths, onItemsLoaded]);

    const isSelected = useCallback((itemPath: string, isDirectory: boolean): boolean => {
        if (!isDirectory) {
            return selectedPaths.has(itemPath);
        }
        // For folders, it's 'selected' visually if *any* descendant file is selected
        for (const p of Array.from(selectedPaths)) {
            if (p.startsWith(itemPath + '\\') || p.startsWith(itemPath + '/')) return true;
        }
        return false;
    }, [selectedPaths]);

    return {
        actionError,
        setActionError,
        toggleSelection,
        isSelected
    };
}
