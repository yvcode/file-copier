"use strict";
const electron = require("electron");
console.log("Preload script: Starting initialization...");
if (!electron.contextBridge || !electron.ipcRenderer) {
  console.error("Preload script: Critical Error - contextBridge or ipcRenderer is missing!");
} else {
  try {
    electron.contextBridge.exposeInMainWorld("ipcRenderer", {
      on(...args) {
        const [channel, listener] = args;
        return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
      },
      off(...args) {
        const [channel, ...omit] = args;
        return electron.ipcRenderer.off(channel, ...omit);
      },
      send(...args) {
        const [channel, ...omit] = args;
        return electron.ipcRenderer.send(channel, ...omit);
      },
      invoke(...args) {
        const [channel, ...omit] = args;
        return electron.ipcRenderer.invoke(channel, ...omit);
      },
      // Directory operations
      getDrives: () => electron.ipcRenderer.invoke("get-drives"),
      readDir: (dirPath) => electron.ipcRenderer.invoke("read-dir", dirPath),
      walkDirRecursive: (dirPath) => electron.ipcRenderer.invoke("walk-dir-recursive", dirPath),
      getFolderSize: (dirPath) => electron.ipcRenderer.invoke("get-folder-size", dirPath),
      // Streaming copy — returns final result, sends progress events
      startCopy: (items, targetDir, userName) => electron.ipcRenderer.invoke("start-copy", { items, targetDir, userName }),
      // Listen for copy progress events
      onCopyProgress: (callback) => {
        const handler = (_event, data) => callback(data);
        electron.ipcRenderer.on("copy-progress", handler);
        return () => electron.ipcRenderer.off("copy-progress", handler);
      },
      // Retry failed files
      retryFailed: (failedFiles, targetDir, userName) => electron.ipcRenderer.invoke("retry-failed", { failedFiles, targetDir, userName }),
      // Legacy — kept for compatibility
      copyItems: (items, destinationName) => electron.ipcRenderer.invoke("copy-items", { items, destinationName }),
      copySingleFile: (sourcePath, destPath) => electron.ipcRenderer.invoke("copy-single-file", { sourcePath, destPath })
    });
    console.log("Preload script: API successfully exposed to Main World.");
  } catch (err) {
    console.error("Preload script: Failed to expose API:", err);
  }
}
