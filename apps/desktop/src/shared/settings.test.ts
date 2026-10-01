import { describe, expect, it } from 'vitest'
import { defaultSettings, newSettingsFile, readSettings, settingsJsonSchema } from './settings'
import { parseShortcut } from './shortcuts'

describe('readSettings', () => {
  it('gives the default settings for an empty or minimal file', () => {
    expect(readSettings('')).toEqual({ settings: defaultSettings, problems: [] })
    expect(readSettings('// nothing yet\n')).toEqual({ settings: defaultSettings, problems: [] })
    expect(readSettings('// only a comment\n{ "$schema": "./settings.schema.json" }')).toEqual({
      settings: defaultSettings,
      problems: []
    })
  })

  it('accepts comments, trailing commas and a byte order mark', () => {
    const text = '\uFEFF{\n  // bigger\n  "terminal.fontSize": 16,\n}'
    const { settings, problems } = readSettings(text)
    expect(problems).toEqual([])
    expect(settings?.terminal).toEqual({ ...defaultSettings.terminal, fontSize: 16 })
  })

  it('reads every setting, and groups them for the app', () => {
    const text = JSON.stringify({
      defaultProfile: 'Git Bash',
      closeOnExit: 'never',
      theme: 'system',
      'terminal.fontFamily': 'Consolas',
      'terminal.fontSize': 12,
      'keys.newTab': 'Ctrl+Alt+N',
      'keys.closeTab': ''
    })
    expect(readSettings(text).settings).toEqual({
      defaultProfile: 'Git Bash',
      closeOnExit: 'never',
      theme: 'system',
      terminal: { fontFamily: 'Consolas', fontSize: 12 },
      keys: { ...defaultSettings.keys, newTab: parseShortcut('Ctrl+Alt+N'), closeTab: null }
    })
  })

  it('gives every action its default shortcut', () => {
    expect(defaultSettings.keys.newTab?.label).toBe('Ctrl+Shift+T')
    expect(defaultSettings.keys.splitRight?.label).toBe('Alt+Shift+=')
    expect(defaultSettings.keys.openSettings?.label).toBe('Ctrl+,')
  })

  it('reports a shortcut it cannot read', () => {
    const { settings, problems } = readSettings('{ "keys.copy": "Ctrl+Shft+C" }')
    expect(settings).toBeUndefined()
    expect(problems).toEqual([
      'keys.copy: not a shortcut: write it like "Ctrl+Shift+T", or "" to turn it off'
    ])
  })

  it('tells plainly what is wrong in the syntax, with the line', () => {
    expect(readSettings('{\n  "closeOnExit": "never"\n  "terminal.fontSize": 12\n}')).toEqual({
      settings: undefined,
      problems: ['Line 3: a comma is missing']
    })
    expect(readSettings('{\n  "closeOnExit": "never"\n').problems).toContain(
      'Line 3: a closing } is missing'
    )
  })

  it('reports wrong values and unknown settings', () => {
    const { settings, problems } = readSettings(
      '{ "closeOnExit": "sometimes", "terminal.fontsize": 12 }'
    )
    expect(settings).toBeUndefined()
    expect(problems).toHaveLength(2)
    expect(problems[0]).toMatch(/^closeOnExit: /)
    expect(problems[1]).toMatch(/"terminal\.fontsize"/)
  })
})

describe('newSettingsFile', () => {
  const file = newSettingsFile('settings.schema.json')

  it('lists every setting, one per line, but sets none of them', () => {
    expect(file).toContain('\n  // "closeOnExit": "graceful",\n')
    expect(file).toContain('\n  // "terminal.fontSize": 14,\n')
    expect(file).toContain('\n  // "keys.newTab": "Ctrl+Shift+T",\n')
    expect(readSettings(file)).toEqual({ settings: defaultSettings, problems: [] })
  })

  it('stays valid with any setting uncommented', () => {
    // Remove the // in front of every setting, as a user would.
    const uncommented = file.replace(/^ {2}\/\/ (?="[^"]+": )/gm, '  ')
    // No description line looks like a setting.
    expect(uncommented).not.toMatch(/^ {2}\/\/ "/m)
    expect(uncommented).toContain('\n  "terminal.fontSize": 14,\n')
    expect(readSettings(uncommented)).toEqual({
      settings: { ...defaultSettings, defaultProfile: 'Git Bash' },
      problems: []
    })
  })
})

describe('settingsJsonSchema', () => {
  it('describes the settings of the file for editors', () => {
    const schema = settingsJsonSchema() as { properties: Record<string, { description?: string }> }
    expect(Object.keys(schema.properties)).toEqual([
      '$schema',
      'defaultProfile',
      'closeOnExit',
      'theme',
      'terminal.fontFamily',
      'terminal.fontSize',
      'keys.newTab',
      'keys.closeTab',
      'keys.nextTab',
      'keys.previousTab',
      'keys.splitRight',
      'keys.splitDown',
      'keys.focusLeft',
      'keys.focusRight',
      'keys.focusUp',
      'keys.focusDown',
      'keys.copy',
      'keys.paste',
      'keys.openSettings'
    ])
    expect(schema.properties['closeOnExit']?.description).toMatch(/graceful/)
  })
})
