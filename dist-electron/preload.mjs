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
      getDrives: () => electron.ipcRenderer.invoke("get-drives"),
      readDir: (dirPath) => electron.ipcRenderer.invoke("read-dir", dirPath),
      copyItems: (items, destinationName) => electron.ipcRenderer.invoke("copy-items", { items, destinationName })
    });
    console.log("Preload script: API successfully exposed to Main World.");
  } catch (err) {
    console.error("Preload script: Failed to expose API:", err);
  }
}
