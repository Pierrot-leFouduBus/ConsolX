// Preload script: runs before the UI and exposes a small, controlled API to it.
import { contextBridge } from 'electron'
import type { ConsolxApi } from '../shared/consolx-api'

const api: ConsolxApi = {
  versions: {
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }
}

contextBridge.exposeInMainWorld('consolx', api)
