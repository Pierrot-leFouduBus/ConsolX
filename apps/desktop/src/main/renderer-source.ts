// Decides where the main window loads the UI from.
import { join } from 'node:path'

export type RendererSource = { type: 'url'; url: string } | { type: 'file'; path: string }

// In dev, electron-vite serves the UI with hot reload at `devServerUrl`.
// A packaged app always loads its built files and ignores that URL,
// so an environment variable can never make it load remote content.
export function getRendererSource(
  isPackaged: boolean,
  devServerUrl: string | undefined,
  mainDir: string
): RendererSource {
  if (!isPackaged && devServerUrl) {
    return { type: 'url', url: devServerUrl }
  }
  return { type: 'file', path: join(mainDir, '../renderer/index.html') }
}
