import { ipcRenderer, contextBridge } from 'electron'

console.log('Preload script: Starting initialization...');

if (!contextBridge || !ipcRenderer) {
  console.error('Preload script: Critical Error - contextBridge or ipcRenderer is missing!');
} else {
  try {
    contextBridge.exposeInMainWorld('ipcRenderer', {
      on(...args: Parameters<typeof ipcRenderer.on>) {
        const [channel, listener] = args
        return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
      },
      off(...args: Parameters<typeof ipcRenderer.off>) {
        const [channel, ...omit] = args
        return ipcRenderer.off(channel, ...omit)
      },
      send(...args: Parameters<typeof ipcRenderer.send>) {
        const [channel, ...omit] = args
        return ipcRenderer.send(channel, ...omit)
      },
      invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
        const [channel, ...omit] = args
        return ipcRenderer.invoke(channel, ...omit)
      },
      // Directory operations
      getDrives: () => ipcRenderer.invoke('get-drives'),
      readDir: (dirPath: string) => ipcRenderer.invoke('read-dir', dirPath),
      walkDirRecursive: (dirPath: string) => ipcRenderer.invoke('walk-dir-recursive', dirPath),
      getFolderSize: (dirPath: string) => ipcRenderer.invoke('get-folder-size', dirPath),

      // Streaming copy — returns final result, sends progress events
      startCopy: (items: { path: string; name: string; isDirectory: boolean }[], targetDir: string, userName: string) =>
        ipcRenderer.invoke('start-copy', { items, targetDir, userName }),

      // Listen for copy progress events
      onCopyProgress: (callback: (data: {
        currentFile: string;
        totalProcessed: number;
        totalFailed: number;
        done: boolean;
      }) => void) => {
        const handler = (_event: any, data: any) => callback(data);
        ipcRenderer.on('copy-progress', handler);
        // Return cleanup function
        return () => ipcRenderer.off('copy-progress', handler);
      },

      // Retry failed files
      retryFailed: (failedFiles: { path: string; error: string }[], targetDir: string, userName: string) =>
        ipcRenderer.invoke('retry-failed', { failedFiles, targetDir, userName }),

      // Legacy — kept for compatibility
      copyItems: (items: string[], destinationName: string) =>
        ipcRenderer.invoke('copy-items', { items, destinationName }),
      copySingleFile: (sourcePath: string, destPath: string) =>
        ipcRenderer.invoke('copy-single-file', { sourcePath, destPath }),
    });
    console.log('Preload script: API successfully exposed to Main World.');
  } catch (err) {
    console.error('Preload script: Failed to expose API:', err);
  }
}
