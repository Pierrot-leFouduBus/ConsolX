// Shape of the API that the preload script exposes to the UI as `window.consolx`.
// Shared by the preload (which builds it) and the renderer (which uses it).
export interface ConsolxApi {
  versions: {
    electron: string
    chrome: string
    node: string
  }
}
