// Environment variables given to the shells started by ConsolX.

export type Environment = Record<string, string>

// Starts from the app's environment, minus Electron's own variables (for example
// ELECTRON_RUN_AS_NODE would break Electron apps started from the terminal), and adds
// the variables that command-line tools read to recognize the terminal.
export function shellEnvironment(base: NodeJS.ProcessEnv, appVersion: string): Environment {
  const env: Environment = {}
  for (const [name, value] of Object.entries(base)) {
    if (value !== undefined && !name.toUpperCase().startsWith('ELECTRON_')) env[name] = value
  }
  env['TERM_PROGRAM'] = 'ConsolX'
  env['TERM_PROGRAM_VERSION'] = appVersion
  // xterm.js displays 24-bit colors.
  env['COLORTERM'] = 'truecolor'
  return env
}
