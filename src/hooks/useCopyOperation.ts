import { useState, useRef, useEffect, useCallback } from 'react';
import type { FileItem, FailedFile, CopyState, CopyPhase } from '../types';

export function useCopyOperation(userName: string, selectedItems: FileItem[]) {
    const [copyState, setCopyState] = useState<CopyState>('preview');
    const [copyPhase, setCopyPhase] = useState<CopyPhase>('counting');
    const [copyError, setCopyError] = useState<string | null>(null);
    const [copyStartTime, setCopyStartTime] = useState(0);

    const [currentFile, setCurrentFile] = useState('');
    const [totalFiles, setTotalFiles] = useState(0);
    const [totalBytes, setTotalBytes] = useState(0);
    const [totalProcessed, setTotalProcessed] = useState(0);
    const [totalFailed, setTotalFailed] = useState(0);
    const [bytesCopied, setBytesCopied] = useState(0);
    const [currentFileBytes, setCurrentFileBytes] = useState(0);
    const [currentFileTotal, setCurrentFileTotal] = useState(0);
    const [failedFiles, setFailedFiles] = useState<FailedFile[]>([]);

    const cleanupRef = useRef<(() => void) | null>(null);

    const resetState = useCallback((phase: CopyPhase) => {
        setCopyState('copying');
        setCopyPhase(phase);
        setCopyError(null);
        setTotalFiles(0);
        setTotalBytes(0);
        setTotalProcessed(0);
        setTotalFailed(0);
        setBytesCopied(0);
        setCurrentFileBytes(0);
        setCurrentFileTotal(0);
        setCurrentFile('');
        setCopyStartTime(Date.now());
    }, []);

    const setupProgressListener = useCallback(() => {
        cleanupRef.current = (window as any).ipcRenderer.onCopyProgress((data: any) => {
            setCurrentFile(data.currentFile);
            setTotalProcessed(data.totalProcessed);
            setTotalFailed(data.totalFailed);
            setBytesCopied(data.bytesCopied || 0);
            setCurrentFileBytes(data.currentFileBytes || 0);
            setCurrentFileTotal(data.currentFileTotal || 0);
            setCopyPhase(data.phase);
            if (data.totalFiles !== undefined) setTotalFiles(data.totalFiles);
            if (data.totalBytes !== undefined) setTotalBytes(data.totalBytes);

            // Set start time only when actual copying begins (past counting phase)
            if (data.phase === 'copying' && data.totalProcessed === 0 && (data.bytesCopied || 0) === 0) {
                setCopyStartTime(Date.now());
            }
        });
    }, []);

    const clearCleanup = useCallback(() => {
        if (cleanupRef.current) {
            cleanupRef.current();
            cleanupRef.current = null;
        }
    }, []);

    const handleCopy = useCallback(async () => {
        if (!(window as any).ipcRenderer) return;

        resetState('counting');
        setFailedFiles([]);

        const targetDir = `C:\\constant\\${userName}`;
        const items = selectedItems.map(i => ({ path: i.path, name: i.name, isDirectory: i.isDirectory }));

        try {
            setupProgressListener();
            const result = await (window as any).ipcRenderer.startCopy(items, targetDir, userName);
            clearCleanup();

            if (!result.success) {
                setCopyError(result.error || 'Copy operation failed. The source drive may be disconnected or corrupted.');
            }

            setTotalFiles(result.totalFiles || 0);
            setTotalBytes(result.totalBytes || 0);
            setTotalProcessed(result.totalProcessed || 0);
            setTotalFailed(result.totalFailed || 0);
            setBytesCopied(result.totalBytes || 0);
            setFailedFiles(result.failedFiles || []);
        } catch (err: any) {
            clearCleanup();
            setCopyError(`Copy operation crashed: ${err?.message || 'Unknown error'}. The drive may be disconnected, corrupted, or out of space.`);
        } finally {
            setCurrentFile('');
            setCopyState('done');
        }
    }, [userName, selectedItems, resetState, setupProgressListener, clearCleanup]);

    const handleRetry = useCallback(async () => {
        if (!(window as any).ipcRenderer || failedFiles.length === 0) return;

        resetState('copying');
        setTotalFiles(failedFiles.length);
        const targetDir = `C:\\constant\\${userName}`;

        try {
            setupProgressListener();
            const result = await (window as any).ipcRenderer.retryFailed(failedFiles, targetDir, userName);
            clearCleanup();

            setTotalProcessed(result.totalProcessed || 0);
            setTotalFailed(result.totalFailed || 0);
            setFailedFiles(result.failedFiles || []);
        } catch (err: any) {
            clearCleanup();
            setCopyError(`Retry failed: ${err?.message || 'Unknown error'}. The drive may be disconnected or corrupted.`);
        } finally {
            setCurrentFile('');
            setCopyState('done');
        }
    }, [userName, failedFiles, resetState, setupProgressListener, clearCleanup]);

    useEffect(() => {
        return clearCleanup;
    }, [clearCleanup]);

    return {
        copyState, setCopyState,
        copyPhase,
        copyError, setCopyError,
        copyStartTime,
        currentFile,
        totalFiles,
        totalBytes,
        totalProcessed,
        totalFailed,
        bytesCopied,
        currentFileBytes,
        currentFileTotal,
        failedFiles,
        handleCopy,
        handleRetry
    };
}
