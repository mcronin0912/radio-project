const {
  app,
  BrowserWindow,
  shell,
  nativeTheme,
  ipcMain,
} = require("electron");
const path = require("path");
const fs = require("fs");
const { startLocalServer } = require("./server");

/** @type {BrowserWindow | null} */
let mainWindow = null;
/** @type {import('http').Server | null} */
let localServer = null;

const isDev = !app.isPackaged;
const DEV_URL = process.env.ELECTRON_START_URL || "http://127.0.0.1:4173";
const BOUNDS_FILE = () => path.join(app.getPath("userData"), "window-bounds.json");
const FAVOURITES_FILE = () =>
  path.join(app.getPath("userData"), "favourites.json");
const VOID = "#08090a";
/** Stable port so browser origin (and localStorage) stay consistent across launches. */
const PREFERRED_PORT = 47821;

function loadBounds() {
  try {
    const raw = fs.readFileSync(BOUNDS_FILE(), "utf8");
    const data = JSON.parse(raw);
    if (
      data &&
      typeof data.width === "number" &&
      typeof data.height === "number" &&
      typeof data.x === "number" &&
      typeof data.y === "number"
    ) {
      return data;
    }
  } catch {
    /* first launch or corrupt file */
  }
  return null;
}

function saveBounds(win) {
  if (!win || win.isDestroyed()) return;
  try {
    const bounds = win.getBounds();
    fs.writeFileSync(BOUNDS_FILE(), JSON.stringify(bounds));
  } catch {
    /* ignore */
  }
}

function readFavouritesFile() {
  try {
    const raw = fs.readFileSync(FAVOURITES_FILE(), "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string" && x.length > 0);
  } catch {
    return [];
  }
}

function writeFavouritesFile(slugs) {
  const list = Array.isArray(slugs)
    ? slugs.filter((x) => typeof x === "string" && x.length > 0)
    : [];
  fs.mkdirSync(path.dirname(FAVOURITES_FILE()), { recursive: true });
  fs.writeFileSync(FAVOURITES_FILE(), JSON.stringify(list));
  return list;
}

function staticRoot() {
  if (isDev) {
    return path.join(__dirname, "..", "out");
  }
  return path.join(process.resourcesPath, "out");
}

function registerIpc() {
  ipcMain.handle("favourites:get", () => readFavouritesFile());
  ipcMain.handle("favourites:set", (_event, slugs) => writeFavouritesFile(slugs));
}

async function createWindow() {
  let startUrl = DEV_URL;

  if (!isDev || process.env.ELECTRON_USE_STATIC === "1") {
    const { server, origin } = await startLocalServer({
      staticRoot: staticRoot(),
      port: PREFERRED_PORT,
    });
    localServer = server;
    startUrl = origin;
  }

  const saved = loadBounds();

  mainWindow = new BrowserWindow({
    width: saved?.width ?? 1280,
    height: saved?.height ?? 860,
    x: saved?.x,
    y: saved?.y,
    minWidth: 900,
    minHeight: 640,
    title: "Radio Project",
    backgroundColor: VOID,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    trafficLightPosition:
      process.platform === "darwin" ? { x: 16, y: 18 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      partition: "persist:radio-project",
    },
    show: false,
  });

  let saveTimer = null;
  const scheduleSave = () => {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveBounds(mainWindow), 300);
  };
  mainWindow.on("resize", scheduleSave);
  mainWindow.on("move", scheduleSave);

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  await mainWindow.loadURL(startUrl);

  mainWindow.on("closed", () => {
    if (saveTimer) clearTimeout(saveTimer);
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  nativeTheme.themeSource = "dark";
  registerIpc();

  try {
    await createWindow();
  } catch (err) {
    console.error("Failed to start Radio Project:", err);
    app.quit();
  }

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    saveBounds(mainWindow);
  }
  if (localServer) {
    localServer.close();
    localServer = null;
  }
});
