// Keyboard shortcuts: the actions they run, their default keys, and how a shortcut
// written in the settings ("Ctrl+Shift+T") is read and matched against a key press.

export const SHORTCUT_ACTIONS = [
  { id: 'newTab', keys: 'Ctrl+Shift+T', description: 'Open a new tab with the default shell.' },
  { id: 'closeTab', keys: 'Ctrl+Shift+W', description: 'Close the active tab.' },
  { id: 'nextTab', keys: 'Ctrl+Tab', description: 'Go to the next tab of the group.' },
  { id: 'previousTab', keys: 'Ctrl+Shift+Tab', description: 'Go to the previous tab.' },
  {
    id: 'splitRight',
    keys: 'Alt+Shift+=',
    description: 'Split the active terminal: a new one on its right, with the same shell.'
  },
  {
    id: 'splitDown',
    keys: 'Alt+Shift+-',
    description: 'Split the active terminal: a new one below it, with the same shell.'
  },
  { id: 'focusLeft', keys: 'Alt+Left', description: 'Go to the terminal on the left.' },
  { id: 'focusRight', keys: 'Alt+Right', description: 'Go to the terminal on the right.' },
  { id: 'focusUp', keys: 'Alt+Up', description: 'Go to the terminal above.' },
  { id: 'focusDown', keys: 'Alt+Down', description: 'Go to the terminal below.' },
  {
    id: 'copy',
    keys: 'Ctrl+Shift+C',
    description: 'Copy the selected text. Ctrl+C also copies when text is selected.'
  },
  { id: 'paste', keys: 'Ctrl+Shift+V', description: 'Paste. Ctrl+V also pastes.' },
  { id: 'openSettings', keys: 'Ctrl+,', description: 'Open this settings file.' }
] as const

export type ShortcutAction = (typeof SHORTCUT_ACTIONS)[number]['id']

export interface Shortcut {
  ctrl: boolean
  shift: boolean
  alt: boolean
  // Lowercase key name, as in KeyboardEvent.key: "t", "=", "tab", "arrowleft"...
  key: string
  // How the shortcut is shown, for example in menus: "Ctrl+Shift+T".
  label: string
}

// Other names accepted for some keys.
const KEY_ALIASES: Record<string, string> = {
  plus: '+',
  minus: '-',
  space: ' ',
  esc: 'escape',
  return: 'enter',
  del: 'delete',
  ins: 'insert',
  left: 'arrowleft',
  right: 'arrowright',
  up: 'arrowup',
  down: 'arrowdown'
}

// Keys with a name; any other key is written as the character it types.
const NAMED_KEYS = new Set([
  'tab',
  'enter',
  'escape',
  'backspace',
  'delete',
  'insert',
  'home',
  'end',
  'pageup',
  'pagedown',
  'arrowleft',
  'arrowright',
  'arrowup',
  'arrowdown',
  ' ',
  ...Array.from({ length: 24 }, (_, index) => `f${index + 1}`)
])

// Reads a shortcut such as "Ctrl+Shift+T", "Alt+Left" or "Ctrl++". Undefined when it is
// not one. A shortcut uses Ctrl or Alt, so that typing text never triggers it, except
// function keys (F1 to F24), which can be used alone.
export function parseShortcut(text: string): Shortcut | undefined {
  const parts = text.trim().split('+')
  // "Ctrl++": the key is the plus sign itself.
  if (parts.length > 2 && parts.at(-1) === '' && parts.at(-2) === '') parts.splice(-2, 2, '+')
  const key = keyName(parts.pop() ?? '')
  if (!key) return undefined

  const shortcut: Shortcut = { ctrl: false, shift: false, alt: false, key, label: '' }
  for (const part of parts) {
    const modifier = part.trim().toLowerCase()
    if (modifier === 'ctrl' || modifier === 'control') shortcut.ctrl = true
    else if (modifier === 'shift') shortcut.shift = true
    else if (modifier === 'alt') shortcut.alt = true
    else return undefined
  }
  if (!shortcut.ctrl && !shortcut.alt && !/^f\d+$/.test(key)) return undefined

  shortcut.label = [
    shortcut.ctrl && 'Ctrl',
    shortcut.alt && 'Alt',
    shortcut.shift && 'Shift',
    keyLabel(key)
  ]
    .filter(Boolean)
    .join('+')
  return shortcut
}

function keyName(text: string): string | undefined {
  const name = text.trim().toLowerCase()
  const key = KEY_ALIASES[name] ?? name
  if (NAMED_KEYS.has(key) || [...key].length === 1) return key
  return undefined
}

function keyLabel(key: string): string {
  if (key === ' ') return 'Space'
  if (key.startsWith('arrow')) return capitalize(key.slice('arrow'.length))
  if (key.startsWith('page')) return `Page${capitalize(key.slice('page'.length))}`
  return capitalize(key)
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// A key press, as the UI sees it.
export interface KeyPress {
  // KeyboardEvent.key: what the key gives with the modifiers pressed ("+" for Shift+=).
  key: string
  // What the same key gives alone with the keyboard layout in use ("=" for Shift+=, or
  // "-" for the 6 key of a French keyboard). Lets "Alt+Shift+=" match whatever Shift
  // changes the character into.
  layoutKey?: string
  ctrl: boolean
  shift: boolean
  alt: boolean
  // The Windows key: never part of a shortcut.
  meta: boolean
}

export function matchesShortcut(shortcut: Shortcut, press: KeyPress): boolean {
  if (press.meta) return false
  if (shortcut.ctrl !== press.ctrl || shortcut.shift !== press.shift) return false
  if (shortcut.alt !== press.alt) return false
  return press.key.toLowerCase() === shortcut.key || press.layoutKey?.toLowerCase() === shortcut.key
}
