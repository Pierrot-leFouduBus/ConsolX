// IPC handlers: the only entry points from the UI into the main process.
// Every argument comes from the UI, so it is checked before use.
import { app, ipcMain } from 'electron'
import { homedir } from 'node:os'
import { IpcChannel } from '../shared/ipc-channels'
import { shellEnvironment } from './shell-env'
import type { ShellLaunch, TerminalManager } from './terminal-manager'
import { downloadUpdate, getUpdateState, installUpdate } from './updater'

export function registerIpcHandlers(terminals: TerminalManager): void {
  ipcMain.handle(IpcChannel.getAppInfo, () => ({ name: app.getName(), version: app.getVersion() }))

  ipcMain.handle(IpcChannel.updateGetState, () => getUpdateState())
  ipcMain.on(IpcChannel.updateDownload, () => downloadUpdate())
  ipcMain.on(IpcChannel.updateInstall, () => installUpdate())

  ipcMain.handle(IpcChannel.terminalCreate, (event, cols: unknown, rows: unknown) => {
    if (!isTerminalSize(cols) || !isTerminalSize(rows)) throw new Error('Invalid terminal size')

    // The terminal belongs to the page that created it, which gets its output.
    const page = event.sender
    const id = terminals.create(defaultLaunch(), { cols, rows }, page.id, {
      onData: (data) => {
        if (!page.isDestroyed()) page.send(IpcChannel.terminalData, id, data)
      },
      onExit: (exitCode) => {
        if (!page.isDestroyed()) page.send(IpcChannel.terminalExit, id, exitCode)
      }
    })
    return id
  })

  ipcMain.on(IpcChannel.terminalWrite, (event, id: unknown, data: unknown) => {
    if (isTerminalId(id) && typeof data === 'string') terminals.write(id, event.sender.id, data)
  })

  ipcMain.on(IpcChannel.terminalResize, (event, id: unknown, cols: unknown, rows: unknown) => {
    if (isTerminalId(id) && isTerminalSize(cols) && isTerminalSize(rows)) {
      terminals.resize(id, event.sender.id, cols, rows)
    }
  })

  ipcMain.on(IpcChannel.terminalKill, (event, id: unknown) => {
    if (isTerminalId(id)) terminals.kill(id, event.sender.id)
  })
}

// Shell started by every terminal, until shell profiles arrive (step 3.2).
function defaultLaunch(): ShellLaunch {
  const file =
    process.platform === 'win32' ? 'powershell.exe' : (process.env['SHELL'] ?? '/bin/bash')
  return {
    file,
    args: [],
    cwd: homedir(),
    env: shellEnvironment(process.env, app.getVersion())
  }
}

function isTerminalId(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0
}

// A number of columns or rows: a whole number within a sane range.
function isTerminalSize(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0 && (value as number) <= 10_000
}
