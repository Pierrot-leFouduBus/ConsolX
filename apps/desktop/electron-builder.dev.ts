// Packaging configuration for ConsolX Dev: a variant of the app that installs next to
// ConsolX, with its own settings, and gets its updates from the development PC over the
// local network. Built by `npm run release:local`, which sets the two variables below.
import type { Configuration } from 'electron-builder'

const version = process.env['CONSOLX_DEV_VERSION']
const updateUrl = process.env['CONSOLX_DEV_UPDATE_URL']
if (!version || !updateUrl) {
  throw new Error('Build ConsolX Dev with "npm run release:local".')
}

const config: Configuration = {
  // Start from the ConsolX configuration and change only what differs.
  extends: 'electron-builder.yml',
  // A different appId lets both apps be installed side by side.
  appId: 'io.github.pierrot-lefoudubus.consolx.dev',
  productName: 'ConsolX Dev',
  // Name and version inside the installed app: separate settings folder
  // (%APPDATA%\ConsolX Dev) and update cache (consolx-dev-updater).
  extraMetadata: { name: 'consolx-dev', productName: 'ConsolX Dev', version },
  directories: { output: 'release-dev' },
  nsis: { artifactName: 'ConsolX-Dev-Setup-${version}.${ext}' },
  // Name the update file latest.yml, even for 0.2.0-dev.N versions.
  detectUpdateChannel: false,
  // Written as a list, it replaces the GitHub source instead of merging with it.
  // Single-range requests keep the local server simple.
  publish: [{ provider: 'generic', url: updateUrl, useMultipleRangeRequest: false }]
}

export default config
