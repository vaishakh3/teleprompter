const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('teleprompterWindow', {
  minimize: () => ipcRenderer.send('window:minimize'),
  togglePin: () => ipcRenderer.send('window:toggle-pin'),
  dockToCamera: () => ipcRenderer.send('window:dock-camera'),
  onPinStateChange: (callback) => ipcRenderer.on('window:pin-state', (_, value) => callback(value))
});
