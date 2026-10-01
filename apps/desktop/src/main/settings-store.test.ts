import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { defaultSettings } from '../shared/settings'
import { SettingsStore } from './settings-store'

describe('SettingsStore', () => {
  let folder: string

  beforeEach(async () => {
    folder = await mkdtemp(join(tmpdir(), 'consolx-settings-'))
  })

  afterEach(async () => {
    await rm(folder, { recursive: true, force: true })
  })

  it('creates a settings file that links to the written schema', async () => {
    const store = new SettingsStore(join(folder, 'ConsolX'))
    const state = await store.load()

    expect(state.problems).toEqual([])
    expect(state.settings).toMatchObject(defaultSettings)
    expect(await readFile(store.file, 'utf8')).toContain('"$schema": "./settings.schema.json"')
    const schema = JSON.parse(
      await readFile(join(folder, 'ConsolX', 'settings.schema.json'), 'utf8')
    )
    expect(schema.properties['terminal.fontSize']).toBeDefined()
  })

  it('keeps an existing settings file', async () => {
    const store = new SettingsStore(folder)
    await writeFile(store.file, '{ "terminal.fontSize": 18 }')
    const state = await store.load()

    expect(state.settings.terminal.fontSize).toBe(18)
    expect(await readFile(store.file, 'utf8')).toBe('{ "terminal.fontSize": 18 }')
  })

  it('keeps the last good settings while the file has a problem', async () => {
    const store = new SettingsStore(folder)
    await writeFile(store.file, '{ "closeOnExit": "never" }')
    await store.load()

    await writeFile(store.file, '{ "closeOnExit": "sometimes" }')
    expect(await store.reload()).toBe(true)
    expect(store.current.settings.closeOnExit).toBe('never')
    expect(store.current.problems).toHaveLength(1)

    await writeFile(store.file, '{ "closeOnExit": "always" }')
    expect(await store.reload()).toBe(true)
    expect(store.current).toEqual({
      settings: { ...defaultSettings, closeOnExit: 'always' },
      problems: []
    })
  })

  it('tells when a read changes nothing', async () => {
    const store = new SettingsStore(folder)
    await store.load()
    expect(await store.reload()).toBe(false)
  })
})
