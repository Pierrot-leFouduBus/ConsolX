// Preload script: runs before the UI and exposes a small, controlled API to it.
// The UI never gets ipcRenderer itself, only the functions below.
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { ConsolxApi, Unsubscribe } from '../shared/consolx-api'
import { IpcChannel } from '../shared/ipc-channels'
import { windowsPty } from '../shared/windows-pty'

const api: ConsolxApi = {
  getAppInfo: () => ipcRenderer.invoke(IpcChannel.getAppInfo),
  appWindow: {
    minimize: () => ipcRenderer.send(IpcChannel.windowMinimize),
    toggleMaximize: () => ipcRenderer.send(IpcChannel.windowToggleMaximize),
    close: () => ipcRenderer.send(IpcChannel.windowClose),
    isMaximized: () => ipcRenderer.invoke(IpcChannel.windowIsMaximized),
    onMaximizedChange: (listener) => subscribe(IpcChannel.windowMaximizedChange, listener)
  },
  terminal: {
    windowsPty: process.platform === 'win32' ? windowsPty(process.getSystemVersion()) : undefined,
    getProfiles: () => ipcRenderer.invoke(IpcChannel.terminalGetProfiles),
    create: (profileId, cols, rows) =>
      ipcRenderer.invoke(IpcChannel.terminalCreate, profileId, cols, rows),
    write: (id, data) => ipcRenderer.send(IpcChannel.terminalWrite, id, data),
    resize: (id, cols, rows) => ipcRenderer.send(IpcChannel.terminalResize, id, cols, rows),
    kill: (id) => ipcRenderer.send(IpcChannel.terminalKill, id),
    onData: (listener) => subscribe(IpcChannel.terminalData, listener),
    onExit: (listener) => subscribe(IpcChannel.terminalExit, listener)
  },
  updates: {
    getState: () => ipcRenderer.invoke(IpcChannel.updateGetState),
    download: () => ipcRenderer.send(IpcChannel.updateDownload),
    install: () => ipcRenderer.send(IpcChannel.updateInstall),
    onState: (listener) => subscribe(IpcChannel.updateState, listener)
  }
}

// Listens to messages from the main process, without passing the IPC event to the UI.
function subscribe<Args extends unknown[]>(
  channel: string,
  listener: (...args: Args) => void
): Unsubscribe {
  const handler = (_event: IpcRendererEvent, ...args: unknown[]) => listener(...(args as Args))
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

contextBridge.exposeInMainWorld('consolx', api)
