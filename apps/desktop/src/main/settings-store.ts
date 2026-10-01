// The settings file, settings.json in the app's data folder (%APPDATA%\ConsolX on
// Windows), and the user CSS file, user.css, next to it. Both are created on first
// start, then read again whenever they change. When the settings file has a problem,
// the last good settings stay in use and the problem is reported.
import { watch, type FSWatcher } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { SettingsState } from '../shared/consolx-api'
import {
  defaultSettings,
  newSettingsFile,
  readSettings,
  settingsJsonSchema
} from '../shared/settings'
import { NEW_USER_CSS_FILE } from './user-css'

const SETTINGS_FILE = 'settings.json'
const SCHEMA_FILE = 'settings.schema.json'
const USER_CSS_FILE = 'user.css'

export class SettingsStore {
  readonly file: string
  readonly userCssFile: string
  private readonly folder: string
  private state: SettingsState = { settings: defaultSettings, problems: [], userCss: '' }
  private watcher: FSWatcher | undefined
  private timer: NodeJS.Timeout | undefined

  constructor(folder: string) {
    this.folder = folder
    this.file = join(folder, SETTINGS_FILE)
    this.userCssFile = join(folder, USER_CSS_FILE)
  }

  get current(): SettingsState {
    return this.state
  }

  // Writes the schema, creates the settings and user CSS files if needed, and reads them.
  async load(): Promise<SettingsState> {
    await mkdir(this.folder, { recursive: true })
    // Written at every start, so that it matches the running version.
    await writeFile(
      join(this.folder, SCHEMA_FILE),
      JSON.stringify(settingsJsonSchema(), null, 2) + '\n'
    )
    await createFile(this.file, newSettingsFile(SCHEMA_FILE))
    await createFile(this.userCssFile, NEW_USER_CSS_FILE)
    await this.reload()
    return this.state
  }

  // Reads the files again. Returns whether the state changed.
  async reload(): Promise<boolean> {
    // A missing settings file means the default settings; a missing user CSS file, no
    // user styles.
    const read = readSettings(await readText(this.file))
    const next = {
      settings: read.settings ?? this.state.settings,
      problems: read.problems,
      userCss: await readText(this.userCssFile)
    }
    const changed = JSON.stringify(next) !== JSON.stringify(this.state)
    this.state = next
    return changed
  }

  // Calls onChange after each change of the files. Editors often replace a file instead
  // of writing into it, so their folder is watched, and a burst of events gives one read.
  watch(onChange: (state: SettingsState) => void): void {
    this.watcher = watch(this.folder, (_event, name) => {
      if (name !== SETTINGS_FILE && name !== USER_CSS_FILE) return
      clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        void this.reload().then((changed) => {
          if (changed) onChange(this.state)
        })
      }, 100)
    })
  }

  close(): void {
    clearTimeout(this.timer)
    this.watcher?.close()
  }
}

// Creates a file with the given text, unless it exists.
async function createFile(path: string, text: string): Promise<void> {
  try {
    await writeFile(path, text, { flag: 'wx' })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
  }
}

// The text of a file, or an empty text when it cannot be read.
async function readText(path: string): Promise<string> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return ''
  }
}
