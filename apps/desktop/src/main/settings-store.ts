// The settings file, settings.json in the app's data folder (%APPDATA%\ConsolX on
// Windows). It is created on first start, then read again whenever it changes. When it
// has a problem, the last good settings stay in use and the problem is reported.
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

const SETTINGS_FILE = 'settings.json'
const SCHEMA_FILE = 'settings.schema.json'

export class SettingsStore {
  readonly file: string
  private readonly folder: string
  private state: SettingsState = { settings: defaultSettings, problems: [] }
  private watcher: FSWatcher | undefined
  private timer: NodeJS.Timeout | undefined

  constructor(folder: string) {
    this.folder = folder
    this.file = join(folder, SETTINGS_FILE)
  }

  get current(): SettingsState {
    return this.state
  }

  // Writes the schema, creates the settings file if needed, and reads it.
  async load(): Promise<SettingsState> {
    await mkdir(this.folder, { recursive: true })
    // Written at every start, so that it matches the running version.
    await writeFile(
      join(this.folder, SCHEMA_FILE),
      JSON.stringify(settingsJsonSchema(), null, 2) + '\n'
    )
    try {
      await writeFile(this.file, newSettingsFile(SCHEMA_FILE), { flag: 'wx' })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error
    }
    await this.reload()
    return this.state
  }

  // Reads the file again. Returns whether the state changed.
  async reload(): Promise<boolean> {
    let text = ''
    try {
      text = await readFile(this.file, 'utf8')
    } catch {
      // A missing file means the default settings.
    }
    const read = readSettings(text)
    const next = { settings: read.settings ?? this.state.settings, problems: read.problems }
    const changed = JSON.stringify(next) !== JSON.stringify(this.state)
    this.state = next
    return changed
  }

  // Calls onChange after each change of the file. Editors often replace the file instead
  // of writing into it, so its folder is watched, and a burst of events gives one read.
  watch(onChange: (state: SettingsState) => void): void {
    this.watcher = watch(this.folder, (_event, name) => {
      if (name !== SETTINGS_FILE) return
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
