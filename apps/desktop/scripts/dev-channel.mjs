// Settings shared by the scripts of the dev update channel (ConsolX Dev).
import { hostname } from 'node:os'
import { join } from 'node:path'

// Port of the local update server (decision M5 of the development plan).
export const PORT = 8765

// Folder served over HTTP: .dev-updates at the root of the repository, ignored by git.
export const SERVE_ROOT = join(import.meta.dirname, '..', '..', '..', '.dev-updates')

// ConsolX Dev finds its updates in this subfolder.
export const CHANNEL_DIR = join(SERVE_ROOT, 'consolx-dev')

// Address of the update folder, using this PC's name rather than its IP address,
// which can change.
export const UPDATE_URL = `http://${hostname().toLowerCase()}:${PORT}/consolx-dev/`

// Dev builds prepare the next minor version: after 0.1.0 come 0.2.0-dev.1, 0.2.0-dev.2...
// The build number restarts at 1 when the app version changes.
export function nextDevVersion(appVersion, lastDevVersion) {
  const [major, minor] = appVersion.split('.').map(Number)
  const base = `${major}.${minor + 1}.0`
  const last = /^(.+)-dev\.(\d+)$/.exec(lastDevVersion ?? '')
  const build = last && last[1] === base ? Number(last[2]) + 1 : 1
  return `${base}-dev.${build}`
}
