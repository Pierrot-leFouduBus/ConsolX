// Preload script: runs before the UI and exposes a small, controlled API to it.
// The UI never gets ipcRenderer itself, only the functions below.
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { ConsolxApi, Unsubscribe } from '../shared/consolx-api'
import { IpcChannel } from '../shared/ipc-channels'

const api: ConsolxApi = {
  getAppInfo: () => ipcRenderer.invoke(IpcChannel.getAppInfo),
  terminal: {
    create: (cols, rows) => ipcRenderer.invoke(IpcChannel.terminalCreate, cols, rows),
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
  },
  proto: {
    getSettings: () => ipcRenderer.invoke(IpcChannel.protoGetSettings),
    recreate: (settings) => ipcRenderer.send(IpcChannel.protoRecreate, settings),
    update: (settings) => ipcRenderer.send(IpcChannel.protoUpdate, settings),
    getInfo: () => ipcRenderer.invoke(IpcChannel.protoGetInfo),
    onInfo: (listener) => subscribe(IpcChannel.protoInfo, listener),
    minimize: () => ipcRenderer.send(IpcChannel.windowMinimize),
    toggleMaximize: () => ipcRenderer.send(IpcChannel.windowToggleMaximize),
    close: () => ipcRenderer.send(IpcChannel.windowClose)
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
