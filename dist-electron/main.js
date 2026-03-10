import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { exec } from "node:child_process";
import fs from "node:fs/promises";
import { promisify } from "node:util";
const require$1 = createRequire(import.meta.url);
const electronModule = require$1("electron");
const app = electronModule.app;
const BrowserWindow = electronModule.BrowserWindow;
const ipcMain = electronModule.ipcMain;
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  if (!BrowserWindow) return;
  const preloadPath = path.join(__dirname$1, "preload.cjs");
  console.log("Attempting to load preload script from:", preloadPath);
  fs.access(preloadPath).then(() => {
    console.log("Preload script file found.");
  }).catch(() => {
    console.error("CRITICAL: Preload script file NOT FOUND at:", preloadPath);
  });
  win = new BrowserWindow({
    fullscreen: true,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
if (app && process.versions.electron) {
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
      win = null;
    }
  });
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  app.whenReady().then(createWindow);
  ipcMain.handle("get-drives", async () => {
    if (process.platform === "win32") {
      try {
        const { stdout } = await execAsync("wmic logicaldisk get name");
        const drives = stdout.split("\n").map((line) => line.trim()).filter((line) => line.endsWith(":"));
        return drives.map((d) => d + "\\");
      } catch (e) {
        console.error("Failed to get drives:", e);
        return ["C:\\"];
      }
    }
    return ["/"];
  });
  ipcMain.handle("read-dir", async (_, dirPath) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const results = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);
        let size = 0;
        try {
          if (!entry.isDirectory()) {
            const stat = await fs.stat(fullPath);
            size = stat.size;
          }
        } catch {
        }
        return {
          name: entry.name,
          isDirectory: entry.isDirectory(),
          path: fullPath,
          size
        };
      }));
      return results;
    } catch (error) {
      console.error(`Failed to read dir ${dirPath}:`, error);
      throw new Error(`Cannot read "${dirPath}": ${(error == null ? void 0 : error.code) || (error == null ? void 0 : error.message) || "Unknown error"}`);
    }
  });
  ipcMain.handle("walk-dir-recursive", async (_, dirPath) => {
    const files = [];
    const stack = [{ current: dirPath, rel: "" }];
    while (stack.length > 0) {
      const { current, rel } = stack.pop();
      try {
        const entries = await fs.readdir(current, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isSymbolicLink()) continue;
          const fullPath = path.join(current, entry.name);
          const relPath = rel ? rel + "\\" + entry.name : entry.name;
          if (entry.isDirectory()) {
            try {
              const lstat = await fs.lstat(fullPath);
              if (lstat.isSymbolicLink()) continue;
            } catch {
              continue;
            }
            stack.push({ current: fullPath, rel: relPath });
          } else {
            let size = 0;
            try {
              const stat = await fs.stat(fullPath);
              size = stat.size;
            } catch {
            }
            files.push({ name: entry.name, relativePath: relPath, path: fullPath, absolutePath: fullPath, isDirectory: false, size });
          }
        }
      } catch {
      }
    }
    return files;
  });
  ipcMain.handle("get-folder-size", async (_, dirPath) => {
    let totalSize = 0;
    const stack = [dirPath];
    while (stack.length > 0) {
      const current = stack.pop();
      try {
        const entries = await fs.readdir(current, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isSymbolicLink()) continue;
          const fullPath = path.join(current, entry.name);
          if (entry.isDirectory()) {
            try {
              const lstat = await fs.lstat(fullPath);
              if (lstat.isSymbolicLink()) continue;
            } catch {
              continue;
            }
            stack.push(fullPath);
          } else {
            try {
              const stat = await fs.stat(fullPath);
              totalSize += stat.size;
            } catch {
            }
          }
        }
      } catch {
      }
    }
    return totalSize;
  });
  ipcMain.handle("start-copy", async (_, {
    items,
    targetDir,
    userName
  }) => {
    const fsSync = require$1("fs");
    let totalFiles = 0;
    let totalBytes = 0;
    let totalProcessed = 0;
    let totalFailed = 0;
    let bytesCopied = 0;
    let currentFileBytes = 0;
    let currentFileTotal = 0;
    const failedFiles = [];
    let lastProgressTime = 0;
    const sendProgress = (currentFile, phase, force = false) => {
      const now = Date.now();
      if (!force && phase !== "done" && now - lastProgressTime < 66) return;
      lastProgressTime = now;
      win == null ? void 0 : win.webContents.send("copy-progress", {
        currentFile,
        totalFiles,
        totalBytes,
        totalProcessed,
        totalFailed,
        bytesCopied,
        currentFileBytes,
        currentFileTotal,
        phase
      });
    };
    const copyFileWithProgress = (src, dest) => {
      return new Promise(async (resolve, reject) => {
        let tempPath = "";
        try {
          const stat = await fs.stat(src);
          currentFileTotal = stat.size;
          currentFileBytes = 0;
          const safeSrcName = src.replace(/[:\\/]/g, "_");
          tempPath = path.join("C:\\temp", userName, safeSrcName);
          await fs.mkdir(path.dirname(tempPath), { recursive: true });
          const readStream = fsSync.createReadStream(src);
          const writeStream = fsSync.createWriteStream(tempPath);
          readStream.on("data", (chunk) => {
            currentFileBytes += chunk.length;
            bytesCopied += chunk.length;
            sendProgress(src, "copying");
          });
          readStream.on("error", (err) => {
            writeStream.destroy();
            reject(err);
          });
          writeStream.on("error", (err) => {
            readStream.destroy();
            reject(err);
          });
          writeStream.on("finish", async () => {
            try {
              await fs.mkdir(path.dirname(dest), { recursive: true });
              try {
                await fs.rename(tempPath, dest);
              } catch (renameErr) {
                if (renameErr.code === "EXDEV") {
                  await fs.cp(tempPath, dest, { force: true });
                  await fs.rm(tempPath, { force: true });
                } else {
                  throw renameErr;
                }
              }
              resolve();
            } catch (moveErr) {
              reject(moveErr);
            }
          });
          readStream.pipe(writeStream);
        } catch (err) {
          if (tempPath) {
            try {
              await fs.rm(tempPath, { force: true });
            } catch {
            }
          }
          reject(err);
        }
      });
    };
    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch (error) {
      return { success: false, error: "Failed to create destination: " + error.message, totalProcessed: 0, totalFailed: 0, totalFiles: 0, totalBytes: 0, failedFiles: [] };
    }
    for (const item of items) {
      totalFiles++;
      try {
        const stat = await fs.stat(item.path);
        totalBytes += stat.size;
      } catch {
      }
      sendProgress("", "counting");
    }
    sendProgress("", "counting", true);
    for (const item of items) {
      const destPath = path.join(targetDir, item.name);
      try {
        await copyFileWithProgress(item.path, destPath);
        totalProcessed++;
      } catch (error) {
        totalProcessed++;
        totalFailed++;
        failedFiles.push({ path: item.path, error: error.message });
      }
      sendProgress(item.path, "copying", true);
    }
    sendProgress("", "done");
    return { success: true, totalProcessed, totalFailed, totalFiles, totalBytes, failedFiles };
  });
  ipcMain.handle("retry-failed", async (_, {
    failedFiles,
    targetDir,
    userName
  }) => {
    let totalProcessed = 0;
    let totalFailed = 0;
    const stillFailed = [];
    for (const file of failedFiles) {
      const destPath = path.join(targetDir, path.basename(file.path));
      try {
        const safeSrcName = file.path.replace(/[:\\/]/g, "_");
        const tempPath = path.join("C:\\temp", userName, safeSrcName);
        await fs.mkdir(path.dirname(tempPath), { recursive: true });
        await fs.cp(file.path, tempPath, { force: true });
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        try {
          await fs.rename(tempPath, destPath);
        } catch (renameErr) {
          if (renameErr.code === "EXDEV") {
            await fs.cp(tempPath, destPath, { force: true });
            await fs.rm(tempPath, { force: true });
          } else {
            throw renameErr;
          }
        }
        totalProcessed++;
      } catch (error) {
        totalProcessed++;
        totalFailed++;
        stillFailed.push({ path: file.path, error: error.message });
      }
      win == null ? void 0 : win.webContents.send("copy-progress", {
        currentFile: file.path,
        totalProcessed,
        totalFailed,
        done: false
      });
    }
    win == null ? void 0 : win.webContents.send("copy-progress", {
      currentFile: "",
      totalProcessed,
      totalFailed,
      done: true
    });
    return { success: true, totalProcessed, totalFailed, failedFiles: stillFailed };
  });
  ipcMain.handle("copy-items", async (_, { items, destinationName }) => {
    const targetDir = `C:\\constant\\${destinationName}`;
    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch (error) {
      return { results: items.map((item) => ({ path: item, success: false, error: "Failed to create destination folder: " + error.message })) };
    }
    const results = [];
    for (const item of items) {
      try {
        const itemName = path.basename(item);
        const destPath = path.join(targetDir, itemName);
        await fs.cp(item, destPath, { recursive: true, force: true });
        results.push({ path: item, success: true });
      } catch (error) {
        console.error(`Copy failed for ${item}:`, error);
        results.push({ path: item, success: false, error: error.message });
      }
    }
    return { results };
  });
  ipcMain.handle("copy-single-file", async (_, { sourcePath, destPath }) => {
    try {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.cp(sourcePath, destPath, { force: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
