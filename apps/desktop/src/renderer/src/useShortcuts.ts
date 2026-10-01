// Keyboard shortcuts of the window. Their keys come from the settings ("keys." settings);
// they act on the tabs, groups and terminals of the workspace.
import type { DockviewApi, DockviewGroupPanel } from 'dockview-react'
import { useEffect, useRef } from 'react'
import type { ShellProfiles } from '../../shared/consolx-api'
import type { Settings } from '../../shared/settings'
import {
  matchesShortcut,
  parseShortcut,
  SHORTCUT_ACTIONS,
  type KeyPress,
  type Shortcut,
  type ShortcutAction
} from '../../shared/shortcuts'
import { defaultShell, openTerminal, splitTerminal, xterms } from './terminals'
import { useSettings } from './useSettings'

type Direction = 'left' | 'right' | 'up' | 'down'

// Ctrl+C copies when text is selected, else it goes to the shell (to stop a command).
// Ctrl+V pastes. As in Windows Terminal; turning off the copy or paste shortcut in the
// settings turns these off too.
const CTRL_C = parseShortcut('Ctrl+C') as Shortcut
const CTRL_V = parseShortcut('Ctrl+V') as Shortcut

export function useShortcuts(api: DockviewApi | undefined, shells: ShellProfiles): void {
  const settings = useSettings()
  // Latest settings, read at each key press, so that the listener stays the same.
  const settingsRef = useRef(settings)

  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  useEffect(() => {
    if (!api) return
    void readKeyboardLayout()
    // The keyboard layout can change while the app runs.
    window.addEventListener('focus', readKeyboardLayout)

    const onKeyDown = (event: KeyboardEvent) => {
      // Text fields, such as the tab rename field, keep every key.
      if (isTextField(event.target)) return
      const press = keyPress(event)
      const action = shortcutAction(press, settingsRef.current, api)
      if (!action) return
      // Listening before the terminals, so that their shells never get the keys.
      event.preventDefault()
      event.stopPropagation()
      runAction(action, api, shells, settingsRef.current)
    }
    window.addEventListener('keydown', onKeyDown, { capture: true })

    return () => {
      window.removeEventListener('focus', readKeyboardLayout)
      window.removeEventListener('keydown', onKeyDown, { capture: true })
    }
  }, [api, shells])
}

// The action of a key press, if any.
function shortcutAction(
  press: KeyPress,
  settings: Settings,
  api: DockviewApi
): ShortcutAction | undefined {
  const { keys } = settings
  if (keys.copy && matchesShortcut(CTRL_C, press) && activeTerminal(api)?.hasSelection()) {
    return 'copy'
  }
  if (keys.paste && matchesShortcut(CTRL_V, press)) return 'paste'
  return SHORTCUT_ACTIONS.find(({ id }) => {
    const shortcut = keys[id]
    return shortcut !== null && matchesShortcut(shortcut, press)
  })?.id
}

function runAction(
  action: ShortcutAction,
  api: DockviewApi,
  shells: ShellProfiles,
  settings: Settings
): void {
  const group = api.activeGroup
  switch (action) {
    case 'newTab': {
      const shell = defaultShell(shells, settings.defaultProfile)
      if (shell) openTerminal(api, shell, group ? { referenceGroup: group } : undefined)
      return
    }
    case 'closeTab':
      api.activePanel?.api.close()
      api.activePanel?.focus()
      return
    case 'nextTab':
    case 'previousTab':
      return showNextTab(group, action === 'nextTab' ? 1 : -1)
    case 'splitRight':
    case 'splitDown':
      if (group) {
        const direction = action === 'splitRight' ? 'right' : 'below'
        splitTerminal(api, shells, settings.defaultProfile, group, direction)
      }
      return
    case 'focusLeft':
      return focusGroup(api, 'left')
    case 'focusRight':
      return focusGroup(api, 'right')
    case 'focusUp':
      return focusGroup(api, 'up')
    case 'focusDown':
      return focusGroup(api, 'down')
    case 'copy': {
      const terminal = activeTerminal(api)
      if (!terminal?.hasSelection()) return
      window.consolx.clipboard.writeText(terminal.getSelection())
      terminal.clearSelection()
      return
    }
    case 'paste': {
      const terminal = activeTerminal(api)
      if (terminal) {
        void window.consolx.clipboard.readText().then((text) => {
          if (text) terminal.paste(text)
        })
      }
      return
    }
    case 'openSettings':
      window.consolx.settings.open()
      return
  }
}

function activeTerminal(api: DockviewApi) {
  const panel = api.activePanel
  return panel ? xterms.get(panel.id) : undefined
}

// Shows the next (1) or previous (-1) tab of the group, going round.
function showNextTab(group: DockviewGroupPanel | undefined, step: 1 | -1): void {
  const panels = group?.panels ?? []
  const active = group?.activePanel
  if (!active || panels.length < 2) return
  const index = panels.indexOf(active)
  panels[(index + step + panels.length) % panels.length]?.api.setActive()
}

// Gives the keyboard to the group next to the active one, on the given side: the
// nearest one facing it, then the one best in line with it.
function focusGroup(api: DockviewApi, direction: Direction): void {
  const from = api.activeGroup
  if (!from) return
  const box = from.element.getBoundingClientRect()
  let best: DockviewGroupPanel | undefined
  let bestScore = Infinity

  for (const group of api.groups) {
    if (group === from) continue
    const other = group.element.getBoundingClientRect()
    const horizontal = direction === 'left' || direction === 'right'
    const facing = horizontal
      ? other.top < box.bottom && other.bottom > box.top
      : other.left < box.right && other.right > box.left
    const distance = {
      left: box.left - other.right,
      right: other.left - box.right,
      up: box.top - other.bottom,
      down: other.top - box.bottom
    }[direction]
    // Groups touch each other: allow a pixel of rounding.
    if (!facing || distance < -1) continue
    const offset = horizontal
      ? Math.abs(other.top + other.height / 2 - (box.top + box.height / 2))
      : Math.abs(other.left + other.width / 2 - (box.left + box.width / 2))
    const score = distance * 10_000 + offset
    if (score < bestScore) {
      best = group
      bestScore = score
    }
  }

  const panel = best?.activePanel
  panel?.api.setActive()
  panel?.focus()
}

function isTextField(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement) return true
  // xterm.js receives the keys of a terminal in a hidden text area of its own.
  return (
    target instanceof HTMLTextAreaElement && !target.classList.contains('xterm-helper-textarea')
  )
}

// The character each key gives alone with the keyboard layout in use, by key position
// (KeyboardEvent.code). Read through Chromium's Keyboard API.
let keyboardLayout = new Map<string, string>()

interface KeyboardApi {
  getLayoutMap(): Promise<Iterable<[string, string]>>
}

async function readKeyboardLayout(): Promise<void> {
  const keyboard = (navigator as Navigator & { keyboard?: KeyboardApi }).keyboard
  try {
    if (keyboard) keyboardLayout = new Map(await keyboard.getLayoutMap())
  } catch {
    // Keep the layout read before: shortcuts still match the character typed.
  }
}

function keyPress(event: KeyboardEvent): KeyPress {
  return {
    key: event.key,
    layoutKey: keyboardLayout.get(event.code),
    ctrl: event.ctrlKey,
    shift: event.shiftKey,
    alt: event.altKey,
    meta: event.metaKey
  }
}
