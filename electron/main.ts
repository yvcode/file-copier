import type { BrowserWindow as BrowserWindowType } from 'electron';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import { promisify } from 'node:util';

const require = createRequire(import.meta.url);
const electronModule = require('electron');
const app = electronModule.app;
const BrowserWindow = electronModule.BrowserWindow;
const ipcMain = electronModule.ipcMain;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);

process.env.APP_ROOT = path.join(__dirname, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindowType | null;

function createWindow() {
  if (!BrowserWindow) return;

  const preloadPath = path.join(__dirname, 'preload.cjs');
  console.log('Attempting to load preload script from:', preloadPath);

  fs.access(preloadPath).then(() => {
    console.log('Preload script file found.');
  }).catch(() => {
    console.error('CRITICAL: Preload script file NOT FOUND at:', preloadPath);
  });

  win = new BrowserWindow({
    fullscreen: true,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: preloadPath,
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win!.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win!.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win!.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

if (app && process.versions.electron) {
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
      win = null;
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.whenReady().then(createWindow);

  // ─── Get Drives ─────────────────────────────────────────────────
  ipcMain.handle('get-drives', async () => {
    if (process.platform === 'win32') {
      try {
        const { stdout } = await execAsync('wmic logicaldisk get name');
        const drives = stdout
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.endsWith(':'));
        return drives.map((d: string) => d + '\\');
      } catch (e) {
        console.error('Failed to get drives:', e);
        return ['C:\\'];
      }
    }
    return ['/'];
  });

  // ─── Read Directory (one level) ─────────────────────────────────
  ipcMain.handle('read-dir', async (_: any, dirPath: string) => {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const results = await Promise.all(entries.map(async (entry: any) => {
        const fullPath = path.join(dirPath, entry.name);
        let size = 0;
        try {
          if (!entry.isDirectory()) {
            const stat = await fs.stat(fullPath);
            size = stat.size;
          }
        } catch { /* ignore stat errors for individual files */ }
        return {
          name: entry.name,
          isDirectory: entry.isDirectory(),
          path: fullPath,
          size,
        };
      }));
      return results;
    } catch (error: any) {
      console.error(`Failed to read dir ${dirPath}:`, error);
      throw new Error(`Cannot read "${dirPath}": ${error?.code || error?.message || 'Unknown error'}`);
    }
  });

  // ─── Walk Directory Recursively (iterative, no limits) ──────────
  // Uses an explicit stack to avoid call stack overflow at depth 1000+.
  // No file count limit. Skips symlinks/junctions.
  ipcMain.handle('walk-dir-recursive', async (_: any, dirPath: string) => {
    const files: { name: string; relativePath: string; path: string; absolutePath: string; isDirectory: boolean; size: number }[] = [];
    const stack: { current: string; rel: string }[] = [{ current: dirPath, rel: '' }];

    while (stack.length > 0) {
      const { current, rel } = stack.pop()!;
      try {
        const entries = await fs.readdir(current, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isSymbolicLink()) continue;
          const fullPath = path.join(current, entry.name);
          const relPath = rel ? rel + '\\' + entry.name : entry.name;

          if (entry.isDirectory()) {
            try {
              const lstat = await fs.lstat(fullPath);
              if (lstat.isSymbolicLink()) continue;
            } catch { continue; }
            stack.push({ current: fullPath, rel: relPath });
          } else {
            let size = 0;
            try { const stat = await fs.stat(fullPath); size = stat.size; } catch { }
            files.push({ name: entry.name, relativePath: relPath, path: fullPath, absolutePath: fullPath, isDirectory: false, size });
          }
        }
      } catch { /* permission errors etc */ }
    }

    return files;
  });

  // ─── Get Folder Size (iterative) ───────────────────────────────
  // Walks iteratively summing file sizes. Returns total bytes.
  ipcMain.handle('get-folder-size', async (_: any, dirPath: string) => {
    let totalSize = 0;
    const stack: string[] = [dirPath];

    while (stack.length > 0) {
      const current = stack.pop()!;
      try {
        const entries = await fs.readdir(current, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isSymbolicLink()) continue;
          const fullPath = path.join(current, entry.name);
          if (entry.isDirectory()) {
            try {
              const lstat = await fs.lstat(fullPath);
              if (lstat.isSymbolicLink()) continue;
            } catch { continue; }
            stack.push(fullPath);
          } else {
            try { const stat = await fs.stat(fullPath); totalSize += stat.size; } catch { }
          }
        }
      } catch { /* permission errors etc */ }
    }

    return totalSize;
  });

  // ─── Streaming Copy ────────────────────────────────────────────
  // Phase 1: Count all files + total bytes.
  // Phase 2: Walk + copy using streams, sending byte-level progress.
  ipcMain.handle('start-copy', async (_: any, {
    items,
    targetDir,
    userName
  }: {
    items: { path: string; name: string; isDirectory: boolean }[];
    targetDir: string;
    userName: string;
  }) => {
    // We need the sync fs module for createReadStream/createWriteStream
    const fsSync = require('fs') as typeof import('fs');

    let totalFiles = 0;
    let totalBytes = 0;
    let totalProcessed = 0;
    let totalFailed = 0;
    let bytesCopied = 0;
    let currentFileBytes = 0;
    let currentFileTotal = 0;
    const failedFiles: { path: string; error: string }[] = [];
    let lastProgressTime = 0;

    const sendProgress = (currentFile: string, phase: 'counting' | 'copying' | 'done', force: boolean = false) => {
      const now = Date.now();
      if (!force && phase !== 'done' && now - lastProgressTime < 66) return;
      lastProgressTime = now;
      win?.webContents.send('copy-progress', {
        currentFile,
        totalFiles,
        totalBytes,
        totalProcessed,
        totalFailed,
        bytesCopied,
        currentFileBytes,
        currentFileTotal,
        phase,
      });
    };

    // Stream-copy a single file with byte-level progress, to a temp file then moved to dest
    const copyFileWithProgress = (src: string, dest: string): Promise<void> => {
      return new Promise(async (resolve, reject) => {
        let tempPath = '';
        try {
          const stat = await fs.stat(src);
          currentFileTotal = stat.size;
          currentFileBytes = 0;

          // Replace colons and slashes for safe temp file name
          const safeSrcName = src.replace(/[:\\/]/g, '_');
          tempPath = path.join('C:\\temp', userName, safeSrcName);

          await fs.mkdir(path.dirname(tempPath), { recursive: true });

          const readStream = fsSync.createReadStream(src);
          const writeStream = fsSync.createWriteStream(tempPath);

          readStream.on('data', (chunk: any) => {
            currentFileBytes += chunk.length;
            bytesCopied += chunk.length;
            sendProgress(src, 'copying');
          });

          readStream.on('error', (err: Error) => {
            writeStream.destroy();
            reject(err);
          });

          writeStream.on('error', (err: Error) => {
            readStream.destroy();
            reject(err);
          });

          writeStream.on('finish', async () => {
            try {
              await fs.mkdir(path.dirname(dest), { recursive: true });
              try {
                await fs.rename(tempPath, dest);
              } catch (renameErr: any) {
                if (renameErr.code === 'EXDEV') {
                  // Fallback for cross-device rename
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
            try { await fs.rm(tempPath, { force: true }); } catch { }
          }
          reject(err);
        }
      });
    };

    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch (error: any) {
      return { success: false, error: 'Failed to create destination: ' + error.message, totalProcessed: 0, totalFailed: 0, totalFiles: 0, totalBytes: 0, failedFiles: [] };
    }

    // ── Phase 1: Count all files + sum sizes ──
    for (const item of items) {
      totalFiles++;
      try { const stat = await fs.stat(item.path); totalBytes += stat.size; } catch { }
      sendProgress('', 'counting');
    }

    sendProgress('', 'counting', true);

    // ── Phase 2: Walk + copy with streams ──
    for (const item of items) {
      const destPath = path.join(targetDir, item.name);
      try {
        await copyFileWithProgress(item.path, destPath);
        totalProcessed++;
      } catch (error: any) {
        totalProcessed++;
        totalFailed++;
        failedFiles.push({ path: item.path, error: error.message });
      }
      sendProgress(item.path, 'copying', true);
    }

    sendProgress('', 'done');

    return { success: true, totalProcessed, totalFailed, totalFiles, totalBytes, failedFiles };
  });

  // ─── Retry Failed Files ─────────────────────────────────────────
  ipcMain.handle('retry-failed', async (_: any, {
    failedFiles,
    targetDir,
    userName
  }: {
    failedFiles: { path: string; error: string }[];
    targetDir: string;
    userName: string;
  }) => {
    let totalProcessed = 0;
    let totalFailed = 0;
    const stillFailed: { path: string; error: string }[] = [];

    for (const file of failedFiles) {
      // Try to reconstruct relative path
      const destPath = path.join(targetDir, path.basename(file.path));
      try {
        const safeSrcName = file.path.replace(/[:\\/]/g, '_');
        const tempPath = path.join('C:\\temp', userName, safeSrcName);
        await fs.mkdir(path.dirname(tempPath), { recursive: true });
        await fs.cp(file.path, tempPath, { force: true });

        await fs.mkdir(path.dirname(destPath), { recursive: true });
        try {
          await fs.rename(tempPath, destPath);
        } catch (renameErr: any) {
          if (renameErr.code === 'EXDEV') {
            await fs.cp(tempPath, destPath, { force: true });
            await fs.rm(tempPath, { force: true });
          } else {
            throw renameErr;
          }
        }
        totalProcessed++;
      } catch (error: any) {
        totalProcessed++;
        totalFailed++;
        stillFailed.push({ path: file.path, error: error.message });
      }
      win?.webContents.send('copy-progress', {
        currentFile: file.path,
        totalProcessed,
        totalFailed,
        done: false,
      });
    }

    win?.webContents.send('copy-progress', {
      currentFile: '',
      totalProcessed,
      totalFailed,
      done: true,
    });

    return { success: true, totalProcessed, totalFailed, failedFiles: stillFailed };
  });

  // Legacy handlers kept for compatibility
  ipcMain.handle('copy-items', async (_: any, { items, destinationName }: { items: string[], destinationName: string }) => {
    const targetDir = `C:\\constant\\${destinationName}`;
    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch (error: any) {
      return { results: items.map((item: string) => ({ path: item, success: false, error: 'Failed to create destination folder: ' + error.message })) };
    }

    const results: { path: string; success: boolean; error?: string }[] = [];
    for (const item of items) {
      try {
        const itemName = path.basename(item);
        const destPath = path.join(targetDir, itemName);
        await fs.cp(item, destPath, { recursive: true, force: true });
        results.push({ path: item, success: true });
      } catch (error: any) {
        console.error(`Copy failed for ${item}:`, error);
        results.push({ path: item, success: false, error: error.message });
      }
    }
    return { results };
  });

  ipcMain.handle('copy-single-file', async (_: any, { sourcePath, destPath }: { sourcePath: string, destPath: string }) => {
    try {
      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.cp(sourcePath, destPath, { force: true });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
