import { useRef, useCallback } from 'react';
import type { FileItem } from '../types';

/**
 * Hook for managing the file item cache.
 * Caches FileItems by path so they persist across page navigations.
 */
export function useFileCache() {
    const cache = useRef<Map<string, FileItem>>(new Map());

    const updateCache = useCallback((items: FileItem[]) => {
        for (const item of items) {
            cache.current.set(item.path, item);
        }
    }, []);

    const getFromCache = useCallback((path: string): FileItem | undefined => {
        return cache.current.get(path);
    }, []);

    const setCacheEntry = useCallback((path: string, item: FileItem) => {
        cache.current.set(path, item);
    }, []);

    return { cache: cache.current, updateCache, getFromCache, setCacheEntry };
}


