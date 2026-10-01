// What the user can set in settings.json, the default values, and how the file is read:
// JSON with comments, checked against a zod schema. Each description is shown by editors
// through the JSON schema made from it.
import { parse, printParseErrorCode, stripComments, type ParseError } from 'jsonc-parser'
import { z } from 'zod'

export const settingsSchema = z.strictObject({
  // Link to the JSON schema, which gives editors completion and descriptions.
  $schema: z.string().optional(),
  defaultProfile: z
    .string()
    .optional()
    .describe(
      'Shell opened at start and in new tabs: its name, as in the + menu. By default, PowerShell 7, or else Windows PowerShell.'
    )
    .meta({ examples: ['Git Bash'] }),
  closeOnExit: z
    .enum(['graceful', 'always', 'never'])
    .default('graceful')
    .describe(
      'Whether a tab closes when its shell ends: "graceful" when it ends without error, "always", or "never".'
    ),
  terminal: z
    .strictObject({
      fontFamily: z
        .string()
        .min(1)
        .default('"Cascadia Mono", Consolas, monospace')
        .describe('Font of the terminals: one or more font names, separated by commas.'),
      fontSize: z
        .number()
        .min(6)
        .max(72)
        .default(14)
        .describe('Font size of the terminals, in pixels.')
    })
    .prefault({})
    .describe('How the terminals look.')
})

export type Settings = z.output<typeof settingsSchema>

export const defaultSettings: Settings = settingsSchema.parse({})

// The part of a JSON schema used here.
interface JsonSchema {
  description?: string
  default?: unknown
  examples?: unknown[]
  properties?: Record<string, JsonSchema>
}

// JSON schema of the settings file, for editors.
export function settingsJsonSchema(): JsonSchema {
  return z.toJSONSchema(settingsSchema, { io: 'input', target: 'draft-7' }) as JsonSchema
}

// Content of a new settings file. Every setting is there, commented out, with its
// description and default value: nothing is set, so the defaults can change with
// updates, and removing the // in front of a setting uses it. Each setting ends with a
// comma, and "$schema" comes last, so any of them can be used without editing commas.
export function newSettingsFile(schemaFile: string): string {
  return [
    '// ConsolX settings. To change a setting, remove the // in front of it and edit its',
    '// value. ConsolX reads the file again each time you save it.',
    '{',
    ...settingLines(settingsJsonSchema(), '  ', false).slice(1),
    '',
    '  // Lets editors such as VS Code suggest and check the settings.',
    `  "$schema": "./${schemaFile}"`,
    '}',
    ''
  ].join('\n')
}

// Lines of the settings of a schema. Inside a commented-out object (nested), the lines
// are already commented by their lead.
function settingLines(schema: JsonSchema, lead: string, nested: boolean): string[] {
  const entries = Object.entries(schema.properties ?? {}).filter(([key]) => key !== '$schema')
  const mark = nested ? '' : '// '
  return entries.flatMap(([key, setting], index) => {
    const comma = !nested || index < entries.length - 1 ? ',' : ''
    const lines = ['', ...wrap(setting.description ?? '').map((line) => `${lead}// ${line}`)]
    if (setting.properties) {
      const inner = nested ? `${lead}  ` : `${lead}//   `
      return [
        ...lines,
        `${lead}${mark}"${key}": {`,
        ...settingLines(setting, inner, true).filter((line) => line !== ''),
        `${lead}${mark}}${comma}`
      ]
    }
    const value = setting.default ?? setting.examples?.[0]
    return [...lines, `${lead}${mark}"${key}": ${JSON.stringify(value)}${comma}`]
  })
}

// Splits a text into lines of at most 80 characters.
function wrap(text: string): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ').filter(Boolean)) {
    if (line && line.length + word.length + 1 > 80) {
      lines.push(line)
      line = word
    } else {
      line = line ? `${line} ${word}` : word
    }
  }
  return line ? [...lines, line] : lines
}

export interface SettingsFileContent {
  // Undefined when the file cannot be used: its problems say why.
  settings: Settings | undefined
  problems: string[]
}

// Reads the text of a settings file. An empty file gives the default settings.
export function readSettings(text: string): SettingsFileContent {
  // Some editors start the file with a byte order mark.
  const json = text.replace(/^\uFEFF/, '')
  if (stripComments(json).trim() === '') return { settings: defaultSettings, problems: [] }
  const errors: ParseError[] = []
  const value: unknown = parse(json, errors, { allowTrailingComma: true })
  if (errors.length > 0) {
    const problems = errors.map(
      ({ error, offset }) => `${printParseErrorCode(error)} at line ${lineAt(json, offset)}`
    )
    return { settings: undefined, problems }
  }

  const result = settingsSchema.safeParse(value ?? {})
  if (!result.success) {
    const problems = result.error.issues.map(({ path, message }) =>
      path.length > 0 ? `${path.join('.')}: ${message}` : message
    )
    return { settings: undefined, problems }
  }
  return { settings: result.data, problems: [] }
}

function lineAt(text: string, offset: number): number {
  return text.slice(0, offset).split('\n').length
}
