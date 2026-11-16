const { app, BrowserWindow, dialog, shell } = require("electron");
const { spawn } = require("node:child_process");
const { randomBytes } = require("node:crypto");
const { createServer } = require("node:net");
const { mkdir, readFile, writeFile } = require("node:fs/promises");
const path = require("node:path");

let nextServer;
let mainWindow;
let quitting = false;
let shutdownRequested = false;
let serverOutput = "";

function rememberOutput(chunk) {
  serverOutput = (serverOutput + chunk.toString()).slice(-5000);
}

async function getFreePort() {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", resolve);
  });
  const { port } = probe.address();
  await new Promise((resolve, reject) => probe.close((error) => (error ? reject(error) : resolve())));
  return port;
}

async function getAuthSecret() {
  const secretPath = path.join(app.getPath("userData"), "auth-secret");
  try {
    return await readFile(secretPath, "utf8");
  } catch {
    const secret = randomBytes(32).toString("base64url");
    await mkdir(path.dirname(secretPath), { recursive: true });
    await writeFile(secretPath, secret, { encoding: "utf8", mode: 0o600 });
    return secret;
  }
}

async function startNextServer() {
  const port = await getFreePort();
  const packaged = app.isPackaged;
  const serverRoot = packaged
    ? path.join(process.resourcesPath, "app-server")
    : path.resolve(__dirname, "..");
  const entry = packaged
    ? path.join(serverRoot, "server.js")
    : path.join(serverRoot, "node_modules", "next", "dist", "bin", "next");
  const dataDirectory = path.join(app.getPath("userData"), ".data");
  await mkdir(dataDirectory, { recursive: true });

  const {
    DATABASE_PROVIDER: _databaseProvider,
    DATABASE_URL: _databaseUrl,
    AUTH_DISCORD_ID: _discordId,
    AUTH_DISCORD_SECRET: _discordSecret,
    ...inheritedEnvironment
  } = process.env;

  const childEnvironment = {
    ...inheritedEnvironment,
    ELECTRON_RUN_AS_NODE: "1",
    ...(packaged
      ? { NODE_PATH: path.join(process.resourcesPath, "app.asar", "node_modules") }
      : {}),
    NODE_ENV: packaged ? "production" : "development",
    HOSTNAME: "127.0.0.1",
    PORT: String(port),
    DATABASE_PROVIDER: "json",
    TECTNAL_DATA_DIR: dataDirectory,
    AUTH_SECRET: await getAuthSecret(),
    AUTH_TRUST_HOST: "true",
    AUTH_URL: `http://127.0.0.1:${port}`,
  };

  nextServer = spawn(process.execPath, packaged ? [entry] : [entry, "dev", "-p", String(port)], {
    cwd: serverRoot,
    env: childEnvironment,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  nextServer.stdout.on("data", rememberOutput);
  nextServer.stderr.on("data", rememberOutput);
  nextServer.once("error", rememberOutput);
  nextServer.once("exit", (code, signal) => {
    if (!quitting && mainWindow && !mainWindow.isDestroyed()) {
      dialog.showErrorBox(
        "تعذّر تشغيل تكتنال",
        `توقف خادم التطبيق (${signal || code || "unknown"}).\n\n${serverOutput.slice(-1800)}`,
      );
      app.quit();
    }
  });

  const address = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (nextServer.exitCode !== null) break;
    try {
      const response = await fetch(address);
      if (response.ok || response.status < 500) return address;
    } catch {
      // The Next.js server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  nextServer.kill();
  throw new Error(`لم يبدأ خادم التطبيق خلال المهلة.\n${serverOutput.slice(-1800)}`);
}

function createMainWindow(address) {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 900,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: "#09090b",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(address)) event.preventDefault();
  });
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.loadURL(address);
}

app.whenReady().then(async () => {
  try {
    const address = await startNextServer();
    createMainWindow(address);
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow(address);
    });
  } catch (error) {
    dialog.showErrorBox(
      "تعذّر تشغيل تكتنال",
      error instanceof Error ? error.message : String(error),
    );
    app.quit();
  }
});

app.on("before-quit", (event) => {
  quitting = true;
  if (!nextServer || nextServer.exitCode !== null) return;

  event.preventDefault();
  if (shutdownRequested) return;
  shutdownRequested = true;

  const server = nextServer;
  const forceStop = setTimeout(() => {
    if (server.exitCode === null) server.kill("SIGKILL");
  }, 4000);
  forceStop.unref();

  server.once("exit", () => {
    clearTimeout(forceStop);
    app.quit();
  });
  server.kill();
});

app.on("window-all-closed", () => app.quit());
