/// <reference types="vite/client" />

export interface IElectronAPI {
    getDrives: () => Promise<string[]>;
    readDir: (dirPath: string) => Promise<{ name: string, isDirectory: boolean, path: string }[]>;
    copyItems: (items: string[], destinationName: string) => Promise<{ success: boolean, error?: string }>;
}

declare global {
    interface Window {
        ipcRenderer: IElectronAPI & import('electron').IpcRenderer;
    }
}
