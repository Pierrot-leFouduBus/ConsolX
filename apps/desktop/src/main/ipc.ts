// IPC handlers: the only entry points from the UI into the main process.
// Every argument comes from the UI, so it is checked before use.
import { app, ipcMain } from 'electron'
import { IpcChannel } from '../shared/ipc-channels'
import type { TerminalManager } from './terminal-manager'
import { downloadUpdate, getUpdateState, installUpdate } from './updater'

export function registerIpcHandlers(terminals: TerminalManager): void {
  ipcMain.handle(IpcChannel.getAppInfo, () => ({ name: app.getName(), version: app.getVersion() }))

  ipcMain.handle(IpcChannel.updateGetState, () => getUpdateState())
  ipcMain.on(IpcChannel.updateDownload, () => downloadUpdate())
  ipcMain.on(IpcChannel.updateInstall, () => installUpdate())

  ipcMain.handle(IpcChannel.terminalCreate, (event, cols: unknown, rows: unknown) => {
    if (!isTerminalSize(cols) || !isTerminalSize(rows)) throw new Error('Invalid terminal size')

    // Send the shell output back to the page that created the terminal.
    const page = event.sender
    const id = terminals.create(cols, rows, {
      onData: (data) => {
        if (!page.isDestroyed()) page.send(IpcChannel.terminalData, id, data)
      },
      onExit: (exitCode) => {
        if (!page.isDestroyed()) page.send(IpcChannel.terminalExit, id, exitCode)
      }
    })
    return id
  })

  ipcMain.on(IpcChannel.terminalWrite, (_event, id: unknown, data: unknown) => {
    if (isTerminalId(id) && typeof data === 'string') terminals.write(id, data)
  })

  ipcMain.on(IpcChannel.terminalResize, (_event, id: unknown, cols: unknown, rows: unknown) => {
    if (isTerminalId(id) && isTerminalSize(cols) && isTerminalSize(rows)) {
      terminals.resize(id, cols, rows)
    }
  })

  ipcMain.on(IpcChannel.terminalKill, (_event, id: unknown) => {
    if (isTerminalId(id)) terminals.kill(id)
  })
}

function isTerminalId(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0
}

// A number of columns or rows: a whole number within a sane range.
function isTerminalSize(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0 && (value as number) <= 10_000
}
