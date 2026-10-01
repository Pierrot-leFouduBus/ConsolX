import { describe, expect, it } from 'vitest'
import { defaultSettings, newSettingsFile, readSettings, settingsJsonSchema } from './settings'

describe('readSettings', () => {
  it('gives the default settings for an empty or minimal file', () => {
    expect(readSettings('')).toEqual({ settings: defaultSettings, problems: [] })
    expect(readSettings('// nothing yet\n')).toEqual({ settings: defaultSettings, problems: [] })
    expect(readSettings('// only a comment\n{ "$schema": "./settings.schema.json" }')).toEqual({
      settings: { ...defaultSettings, $schema: './settings.schema.json' },
      problems: []
    })
  })

  it('accepts comments, trailing commas and a byte order mark', () => {
    const text = '\uFEFF{\n  // bigger\n  "terminal": { "fontSize": 16, },\n}'
    const { settings, problems } = readSettings(text)
    expect(problems).toEqual([])
    expect(settings?.terminal).toEqual({ ...defaultSettings.terminal, fontSize: 16 })
  })

  it('reads every setting', () => {
    const text = JSON.stringify({
      defaultProfile: 'Git Bash',
      closeOnExit: 'never',
      terminal: { fontFamily: 'Consolas', fontSize: 12 }
    })
    expect(readSettings(text).settings).toEqual({
      defaultProfile: 'Git Bash',
      closeOnExit: 'never',
      terminal: { fontFamily: 'Consolas', fontSize: 12 }
    })
  })

  it('reports a syntax error with its line', () => {
    const { settings, problems } = readSettings('{\n  "closeOnExit": "never"\n  "terminal": {}\n}')
    expect(settings).toBeUndefined()
    expect(problems).toEqual(['CommaExpected at line 3'])
  })

  it('reports wrong values and unknown settings with their place', () => {
    const { settings, problems } = readSettings(
      '{ "closeOnExit": "sometimes", "terminal": { "fontsize": 12 } }'
    )
    expect(settings).toBeUndefined()
    expect(problems).toHaveLength(2)
    expect(problems[0]).toMatch(/^closeOnExit: /)
    expect(problems[1]).toMatch(/^terminal: .*"fontsize"/)
  })
})

describe('newSettingsFile', () => {
  const file = newSettingsFile('settings.schema.json')

  it('lists every setting but sets none of them', () => {
    expect(file).toContain('// "closeOnExit": "graceful",')
    expect(file).toContain('//   "fontSize": 14')
    expect(readSettings(file)).toEqual({
      settings: { ...defaultSettings, $schema: './settings.schema.json' },
      problems: []
    })
  })

  it('stays valid when every setting is uncommented', () => {
    // Remove the // in front of each setting and closing brace, as a user would.
    const uncommented = file.replace(/^(\s*)\/\/ (\s*("[^"]+": |}))/gm, '$1$2')
    expect(uncommented).toContain('\n    "fontSize": 14\n  },\n')
    expect(readSettings(uncommented)).toEqual({
      settings: {
        ...defaultSettings,
        $schema: './settings.schema.json',
        defaultProfile: 'Git Bash'
      },
      problems: []
    })
  })
})

describe('settingsJsonSchema', () => {
  it('describes the settings for editors', () => {
    const schema = settingsJsonSchema() as { properties: Record<string, { description?: string }> }
    expect(Object.keys(schema.properties)).toEqual([
      '$schema',
      'defaultProfile',
      'closeOnExit',
      'terminal'
    ])
    expect(schema.properties['closeOnExit']?.description).toMatch(/graceful/)
  })
})
