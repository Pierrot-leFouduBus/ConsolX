// What the user can set in settings.json, the default values, and how the file is read:
// JSON with comments, checked against a zod schema. Each description is shown by editors
// through the JSON schema made from it.
import {
  parse,
  printParseErrorCode,
  stripComments,
  type ParseError,
  type ParseErrorCode
} from 'jsonc-parser'
import { z } from 'zod'

// The file holds one setting per line, as in VS Code: a group of settings is a prefix of
// their names ("terminal."), not a nested object, so that using a setting only takes
// removing the // in front of its line.
const settingsFileSchema = z.strictObject({
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
      'Whether a tab closes when its shell ends: graceful (only when it ends without error), always or never.'
    ),
  'terminal.fontFamily': z
    .string()
    .min(1)
    .default('"Cascadia Mono", Consolas, monospace')
    .describe('Font of the terminals: one or more font names, separated by commas.'),
  'terminal.fontSize': z
    .number()
    .min(6)
    .max(72)
    .default(14)
    .describe('Font size of the terminals, in pixels.')
})

// The settings as the app uses them, grouped.
export const settingsSchema = settingsFileSchema.transform((file) => ({
  defaultProfile: file.defaultProfile,
  closeOnExit: file.closeOnExit,
  terminal: { fontFamily: file['terminal.fontFamily'], fontSize: file['terminal.fontSize'] }
}))

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
  const settings = Object.entries(settingsJsonSchema().properties ?? {})
    .filter(([name]) => name !== '$schema')
    .flatMap(([name, setting]) => [
      '',
      ...wrap(setting.description ?? '').map((line) => `  // ${line}`),
      `  // "${name}": ${JSON.stringify(setting.default ?? setting.examples?.[0])},`
    ])
  return [
    '// ConsolX settings. To change a setting, remove the // in front of it and edit its',
    '// value. ConsolX reads the file again each time you save it.',
    '{',
    ...settings.slice(1),
    '',
    '  // Lets editors such as VS Code suggest and check the settings.',
    `  "$schema": "./${schemaFile}"`,
    '}',
    ''
  ].join('\n')
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
      ({ error, offset }) => `Line ${lineAt(json, offset)}: ${syntaxProblem(error)}`
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

// The most common mistakes, said plainly, by the name jsonc-parser gives them.
const SYNTAX_PROBLEMS: Record<string, string> = {
  CommaExpected: 'a comma is missing',
  CloseBraceExpected: 'a closing } is missing',
  ColonExpected: 'a colon (:) is missing after the setting name',
  ValueExpected: 'a value is missing',
  PropertyNameExpected: 'a setting name, in double quotes, is expected',
  EndOfFileExpected: 'there is text after the final }',
  UnexpectedEndOfString: 'a text is not closed by a double quote',
  UnexpectedEndOfComment: 'a comment is not closed',
  InvalidSymbol: 'unexpected character'
}

function syntaxProblem(error: ParseErrorCode): string {
  const name = printParseErrorCode(error)
  return SYNTAX_PROBLEMS[name] ?? name
}
