// IPC handlers: the only entry points from the UI into the main process.
// Every argument comes from the UI, so it is checked before use.
import {
  app,
  BrowserWindow,
  clipboard,
  ipcMain,
  type IpcMainEvent,
  type IpcMainInvokeEvent
} from 'electron'
import { homedir } from 'node:os'
import { IpcChannel } from '../shared/ipc-channels'
import { openFile } from './open-file'
import type { SettingsStore } from './settings-store'
import { shellEnvironment } from './shell-env'
import { defaultProfileId, detectShellProfiles } from './shell-profiles'
import type { TerminalManager } from './terminal-manager'
import { downloadUpdate, getUpdateState, installUpdate } from './updater'
import { toggleMaximize } from './window-frame'

export function registerIpcHandlers(
  terminals: TerminalManager,
  settings: SettingsStore,
  settingsLoaded: Promise<unknown>
): void {
  // Look for the installed shells once, in the background, at startup.
  const detectedProfiles = detectShellProfiles()

  ipcMain.handle(IpcChannel.getAppInfo, () => ({ name: app.getName(), version: app.getVersion() }))

  ipcMain.handle(IpcChannel.settingsGetState, async () => {
    await settingsLoaded
    return settings.current
  })
  ipcMain.on(IpcChannel.settingsOpen, () => void openFile(settings.file))

  // Window buttons: each acts on the window of the page that sent it.
  ipcMain.on(IpcChannel.windowMinimize, (event) => windowOf(event)?.minimize())
  ipcMain.on(IpcChannel.windowToggleMaximize, (event) => {
    const window = windowOf(event)
    if (window) toggleMaximize(window)
  })
  ipcMain.on(IpcChannel.windowClose, (event) => windowOf(event)?.close())
  ipcMain.handle(IpcChannel.windowIsMaximized, (event) => windowOf(event)?.isMaximized() ?? false)

  ipcMain.handle(IpcChannel.clipboardReadText, () => clipboard.readText())
  ipcMain.on(IpcChannel.clipboardWriteText, (_event, text: unknown) => {
    if (typeof text === 'string') clipboard.writeText(text)
  })

  ipcMain.handle(IpcChannel.updateGetState, () => getUpdateState())
  ipcMain.on(IpcChannel.updateDownload, () => downloadUpdate())
  ipcMain.on(IpcChannel.updateInstall, () => installUpdate())

  ipcMain.handle(IpcChannel.terminalGetProfiles, async () => {
    const profiles = await detectedProfiles
    return {
      profiles: profiles.map(({ id, name }) => ({ id, name })),
      defaultId: defaultProfileId(profiles)
    }
  })

  ipcMain.handle(
    IpcChannel.terminalCreate,
    async (event, profileId: unknown, cols: unknown, rows: unknown) => {
      if (profileId !== null && typeof profileId !== 'string') throw new Error('Invalid profile')
      if (!isTerminalSize(cols) || !isTerminalSize(rows)) throw new Error('Invalid terminal size')

      // Only a detected profile can be started.
      const profiles = await detectedProfiles
      const wanted = profileId ?? defaultProfileId(profiles)
      const profile = profiles.find((candidate) => candidate.id === wanted)
      if (!profile) throw new Error(`Unknown shell profile: ${wanted}`)

      const launch = {
        file: profile.file,
        args: profile.args,
        cwd: homedir(),
        env: shellEnvironment(process.env, app.getVersion())
      }

      // The terminal belongs to the page that created it, which gets its output.
      const page = event.sender
      const id = terminals.create(launch, { cols, rows }, page.id, {
        onData: (data) => {
          if (!page.isDestroyed()) page.send(IpcChannel.terminalData, id, data)
        },
        onExit: (exitCode) => {
          if (!page.isDestroyed()) page.send(IpcChannel.terminalExit, id, exitCode)
        }
      })
      return id
    }
  )

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

function windowOf(event: IpcMainEvent | IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender)
}

function isTerminalId(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0
}

// A number of columns or rows: a whole number within a sane range.
function isTerminalSize(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0 && (value as number) <= 10_000
}
