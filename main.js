const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;

function getCameraDockBounds() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { workArea } = primaryDisplay;
  const width = Math.min(1120, workArea.width - 80);
  const height = Math.min(520, workArea.height - 80);
  const x = Math.round(workArea.x + (workArea.width - width) / 2);
  const y = Math.round(workArea.y + 32);

  return { width, height, x, y };
}

function createWindow() {
  const bounds = getCameraDockBounds();

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 760,
    minHeight: 420,
    backgroundColor: '#00000000',
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    movable: true,
    resizable: true,
    fullscreenable: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 20, y: 20 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('window:minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('window:toggle-pin', () => {
  if (!mainWindow) {
    return;
  }

  const pinned = mainWindow.isAlwaysOnTop();
  mainWindow.setAlwaysOnTop(!pinned, 'screen-saver');
  mainWindow.webContents.send('window:pin-state', !pinned);
});

ipcMain.on('window:dock-camera', () => {
  if (!mainWindow) {
    return;
  }

  mainWindow.setBounds(getCameraDockBounds());
});
