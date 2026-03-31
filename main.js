const { app, BrowserWindow, ipcMain, screen } = require('electron');
const fs = require('fs/promises');
const path = require('path');

let mainWindow;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  if (process.env.README_CAPTURE === '1') {
    mainWindow.webContents.once('did-finish-load', async () => {
      await captureReadmeShots();
      app.quit();
    });
  }
}

async function captureReadmeShots() {
  if (!mainWindow) {
    return;
  }

  const assetsDir = path.join(__dirname, 'assets');
  await fs.mkdir(assetsDir, { recursive: true });

  const overviewScript = `
    (() => {
      const scriptInput = document.getElementById('scriptInput');
      const fontInput = document.getElementById('fontInput');
      const speedInput = document.getElementById('speedInput');
      const crawlTrack = document.getElementById('crawlTrack');
      scriptInput.value = 'Welcome to Tele.\\n\\nKeep your eyes close to the webcam while the script rises gently through the reading band.\\n\\nAdjust speed, font size, and window placement as you speak.';
      fontInput.value = '36';
      fontInput.dispatchEvent(new Event('input', { bubbles: true }));
      speedInput.value = '24';
      speedInput.dispatchEvent(new Event('input', { bubbles: true }));
      crawlTrack.style.transform = 'translate3d(0, 78px, 0)';
    })();
  `;

  await mainWindow.webContents.executeJavaScript(overviewScript);
  await wait(250);
  let image = await mainWindow.webContents.capturePage();
  await fs.writeFile(path.join(assetsDir, 'tele-overview.png'), image.toPNG());

  const focusScript = `
    (() => {
      const scriptInput = document.getElementById('scriptInput');
      const fontInput = document.getElementById('fontInput');
      const speedInput = document.getElementById('speedInput');
      const crawlTrack = document.getElementById('crawlTrack');
      scriptInput.value = 'A teleprompter that stays near the camera.\\n\\nSoft glass styling, always-on-top behavior, and a clean multiline reading flow for video calls, tutorials, and presentations.';
      fontInput.value = '34';
      fontInput.dispatchEvent(new Event('input', { bubbles: true }));
      speedInput.value = '18';
      speedInput.dispatchEvent(new Event('input', { bubbles: true }));
      crawlTrack.style.transform = 'translate3d(0, 70px, 0)';
    })();
  `;

  mainWindow.setBounds({ ...mainWindow.getBounds(), height: 560 });
  await mainWindow.webContents.executeJavaScript(focusScript);
  await wait(250);
  image = await mainWindow.webContents.capturePage();
  await fs.writeFile(path.join(assetsDir, 'tele-reading-view.png'), image.toPNG());
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
