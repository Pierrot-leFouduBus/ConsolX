// Types for the renderer: Vite features and the API added by the preload script.
/// <reference types="vite/client" />
import type { ConsolxApi } from '../../shared/consolx-api'

declare global {
  interface Window {
    consolx: ConsolxApi
  }
}
