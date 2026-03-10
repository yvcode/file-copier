import { useState, useCallback } from 'react';
import type { FileItem } from '../types';
import { useFileCache } from './useFileCache';

export function useAppOrchestrator() {
    const [userName, setUserName] = useState('');
    const [step, setStep] = useState(1);
    const [selectedItems, setSelectedItems] = useState<FileItem[]>([]);
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
    const [globalError, setGlobalError] = useState<string | null>(null);

    const { updateCache, getFromCache } = useFileCache();

    const handleCopySelected = useCallback(() => {
        const pathsArray = Array.from(selectedPaths);

        const allItems: FileItem[] = [];
        const missingPaths: string[] = [];

        // All paths are now flat files, just pull them
        for (const p of pathsArray) {
            const cached = getFromCache(p);
            if (cached) allItems.push(cached);
            else missingPaths.push(p);
        }

        if (missingPaths.length > 0) {
            setGlobalError(`Warning: ${missingPaths.length} item(s) not found in cache. Proceeding with ${allItems.length} available item(s).`);
        }
        if (allItems.length === 0) {
            setGlobalError('No items could be loaded for copying. Please try selecting again.');
            return;
        }

        setSelectedItems(allItems);
        setStep(3);
    }, [selectedPaths, getFromCache]);

    const handleExcludeFile = useCallback(async (excludePath: string) => {
        const newPaths = new Set(selectedPaths);

        // Remove the exact path if it's a single file
        newPaths.delete(excludePath);

        // Remove any descendant paths (if excludePath was a virtual folder clicking X in the summary)
        for (const p of Array.from(newPaths)) {
            if (p.startsWith(excludePath + '\\') || p.startsWith(excludePath + '/')) {
                newPaths.delete(p);
            }
        }

        // Rebuild selectedItems directly from the updated Set
        const newItems: FileItem[] = [];
        for (const p of Array.from(newPaths)) {
            const item = getFromCache(p);
            if (item) newItems.push(item);
        }

        setSelectedItems(newItems);
        setSelectedPaths(newPaths);
    }, [selectedPaths, getFromCache]);

    const resetSelectionAndGoBack = useCallback(() => {
        setSelectedItems([]);
        setSelectedPaths(new Set());
        setStep(2);
    }, []);

    return {
        // State
        userName, setUserName,
        step, setStep,
        selectedItems,
        selectedPaths, setSelectedPaths,
        globalError, setGlobalError,

        // Actions
        updateCache,
        handleCopySelected,
        handleExcludeFile,
        resetSelectionAndGoBack
    };
}
