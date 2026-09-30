// Main process: creates the window and manages the app lifecycle.
// PROTOTYPE branch: the window comes from prototype.ts.
import { app, BrowserWindow } from 'electron'
import { registerIpcHandlers } from './ipc'
import { createWindow, isReplacingWindow, registerPrototypeIpc } from './prototype'
import { TerminalManager } from './terminal-manager'
import { startAutoUpdate } from './updater'

const terminals = new TerminalManager()
registerIpcHandlers(terminals)
registerPrototypeIpc(terminals)

void app.whenReady().then(() => {
  createWindow(terminals)
  startAutoUpdate()

  // macOS: re-create a window when the dock icon is clicked and none is open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(terminals)
  })
})

// Quit when all windows are closed, except on macOS where apps stay active,
// and while the prototype replaces its window.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin' && !isReplacingWindow()) app.quit()
})

// Never leave shells running after the app quits.
app.on('will-quit', () => terminals.killAll())
