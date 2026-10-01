// Colors of the terminals, read from the theme variables (--cx-terminal-*, in theme.css),
// as xterm.js needs them: it draws the terminals itself and does not read CSS.
import type { ITheme } from '@xterm/xterm'

const ANSI_COLORS = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'] as const

export function terminalTheme(element: Element = document.documentElement): ITheme {
  const style = getComputedStyle(element)
  // A variable the theme leaves out keeps the xterm.js default color.
  const color = (name: string) =>
    style.getPropertyValue(`--cx-terminal-${name}`).trim() || undefined

  const theme: ITheme = {
    background: color('bg'),
    foreground: color('fg'),
    cursor: color('cursor'),
    cursorAccent: color('cursor-text'),
    selectionBackground: color('selection')
  }
  for (const name of ANSI_COLORS) {
    const bright =
      `bright${name[0]!.toUpperCase()}${name.slice(1)}` as `bright${Capitalize<typeof name>}`
    theme[name] = color(name)
    theme[bright] = color(`bright-${name}`)
  }
  return theme
}
