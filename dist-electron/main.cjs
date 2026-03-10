import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { exec } from "node:child_process";
import fs from "node:fs/promises";
import { promisify } from "node:util";
createRequire(import.meta.url);
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const execAsync = promisify(exec);
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    fullscreen: true,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      sandbox: false
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
    return entries.map((entry) => ({
      name: entry.name,
      isDirectory: entry.isDirectory(),
      path: path.join(dirPath, entry.name)
    }));
  } catch (error) {
    console.error(`Failed to read dir ${dirPath}:`, error);
    return [];
  }
});
ipcMain.handle("copy-items", async (_, { items, destinationName }) => {
  try {
    const targetDir = `C:\\constant\\${destinationName}`;
    await fs.mkdir(targetDir, { recursive: true });
    for (const item of items) {
      const itemName = path.basename(item);
      const destPath = path.join(targetDir, itemName);
      await fs.cp(item, destPath, { recursive: true, force: true });
    }
    return { success: true };
  } catch (error) {
    console.error("Copy items failed:", error);
    return { success: false, error: error.message };
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
