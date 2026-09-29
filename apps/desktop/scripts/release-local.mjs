// Publishes a ConsolX Dev build on the local update server (npm run release:local):
// 1. picks the next dev version (0.2.0-dev.1, 0.2.0-dev.2...);
// 2. builds the app and its installer with electron-builder.dev.ts;
// 3. copies the installer and latest.yml into the served folder.
import { execSync } from 'node:child_process'
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync
} from 'node:fs'
import { join } from 'node:path'
import { CHANNEL_DIR, UPDATE_URL, nextDevVersion } from './dev-channel.mjs'

// Installers kept in the served folder; older ones are deleted.
const KEEP_INSTALLERS = 3

const desktopDir = join(import.meta.dirname, '..')
const outputDir = join(desktopDir, 'release-dev')

// 1. Next version, from the app version and the last published dev build.
const appVersion = JSON.parse(readFileSync(join(desktopDir, 'package.json'), 'utf8')).version
const version = nextDevVersion(appVersion, publishedVersion())
console.log(`\nBuilding ConsolX Dev ${version}, updates from ${UPDATE_URL}\n`)

// 2. Build the app, then the installer.
const env = { ...process.env, CONSOLX_DEV_VERSION: version, CONSOLX_DEV_UPDATE_URL: UPDATE_URL }
run('npx electron-vite build')
run('npx electron-builder --config electron-builder.dev.ts --publish never')

// 3. Publish: latest.yml goes last, so it never points to a file not yet copied.
const installer = `ConsolX-Dev-Setup-${version}.exe`
mkdirSync(CHANNEL_DIR, { recursive: true })
for (const file of [installer, `${installer}.blockmap`, 'latest.yml']) {
  copyFileSync(join(outputDir, file), join(CHANNEL_DIR, file))
}
deleteOldInstallers()
console.log(`\nConsolX Dev ${version} published in ${CHANNEL_DIR}`)

function run(command) {
  execSync(command, { cwd: desktopDir, env, stdio: 'inherit' })
}

// Version in the published latest.yml, if any.
function publishedVersion() {
  const file = join(CHANNEL_DIR, 'latest.yml')
  if (!existsSync(file)) return undefined
  return /^version:\s*(\S+)/m.exec(readFileSync(file, 'utf8'))?.[1]
}

// Keep the most recent installers, with their blockmaps (used for partial downloads).
function deleteOldInstallers() {
  const installers = readdirSync(CHANNEL_DIR)
    .filter((file) => /^ConsolX-Dev-Setup-.+\.exe$/.test(file))
    .sort((a, b) => statSync(join(CHANNEL_DIR, b)).mtimeMs - statSync(join(CHANNEL_DIR, a)).mtimeMs)
  for (const file of installers.slice(KEEP_INSTALLERS)) {
    rmSync(join(CHANNEL_DIR, file), { force: true })
    rmSync(join(CHANNEL_DIR, `${file}.blockmap`), { force: true })
  }
}
