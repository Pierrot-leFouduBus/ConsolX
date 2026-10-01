import { describe, expect, it } from 'vitest'
import { matchesShortcut, parseShortcut, SHORTCUT_ACTIONS, type KeyPress } from './shortcuts'

describe('parseShortcut', () => {
  it('reads modifiers and a key, whatever the case and spaces', () => {
    expect(parseShortcut('Ctrl+Shift+T')).toEqual({
      ctrl: true,
      shift: true,
      alt: false,
      key: 't',
      label: 'Ctrl+Shift+T'
    })
    expect(parseShortcut(' control + shift + t ')?.label).toBe('Ctrl+Shift+T')
    expect(parseShortcut('shift+alt+=')?.label).toBe('Alt+Shift+=')
  })

  it('knows named keys and their other names', () => {
    expect(parseShortcut('Alt+Left')?.key).toBe('arrowleft')
    expect(parseShortcut('Alt+ArrowLeft')?.label).toBe('Alt+Left')
    expect(parseShortcut('Ctrl+Tab')?.key).toBe('tab')
    expect(parseShortcut('Ctrl+PageDown')?.label).toBe('Ctrl+PageDown')
    expect(parseShortcut('Ctrl+Space')?.key).toBe(' ')
    expect(parseShortcut('Ctrl+Plus')?.key).toBe('+')
    expect(parseShortcut('Ctrl++')?.key).toBe('+')
    expect(parseShortcut('Ctrl+,')?.key).toBe(',')
  })

  it('accepts function keys alone', () => {
    expect(parseShortcut('F11')?.label).toBe('F11')
  })

  it('refuses what is not a shortcut', () => {
    for (const text of ['', 'T', 'Shift+T', 'Ctrl+', 'Ctrl+Shft+T', 'Ctrl+Hello', 'Win+T']) {
      expect(parseShortcut(text), text).toBeUndefined()
    }
  })

  it('reads every default shortcut', () => {
    for (const action of SHORTCUT_ACTIONS) {
      expect(parseShortcut(action.keys), action.id).toBeDefined()
    }
  })
})

describe('matchesShortcut', () => {
  const press = (key: string, modifiers: Partial<KeyPress> = {}): KeyPress => ({
    key,
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    ...modifiers
  })
  const shortcut = (text: string) => parseShortcut(text)!

  it('needs exactly the same modifiers', () => {
    expect(matchesShortcut(shortcut('Ctrl+Shift+T'), press('T', { ctrl: true, shift: true }))).toBe(
      true
    )
    expect(matchesShortcut(shortcut('Ctrl+Shift+T'), press('t', { ctrl: true }))).toBe(false)
    expect(
      matchesShortcut(shortcut('Ctrl+T'), press('t', { ctrl: true, alt: true, shift: false }))
    ).toBe(false)
    expect(matchesShortcut(shortcut('Ctrl+T'), press('t', { ctrl: true, meta: true }))).toBe(false)
  })

  it('matches the key of the keyboard layout when Shift changes the character', () => {
    // US keyboard: Shift+= types "+".
    const splitRight = shortcut('Alt+Shift+=')
    expect(matchesShortcut(splitRight, press('+', { alt: true, shift: true }))).toBe(false)
    expect(
      matchesShortcut(splitRight, press('+', { alt: true, shift: true, layoutKey: '=' }))
    ).toBe(true)
    // French keyboard: "-" is on the 6 key, and Shift+6 types "6".
    expect(
      matchesShortcut(
        shortcut('Alt+Shift+-'),
        press('6', { alt: true, shift: true, layoutKey: '-' })
      )
    ).toBe(true)
  })

  it('matches named keys', () => {
    expect(matchesShortcut(shortcut('Alt+Left'), press('ArrowLeft', { alt: true }))).toBe(true)
    expect(
      matchesShortcut(shortcut('Ctrl+Shift+Tab'), press('Tab', { ctrl: true, shift: true }))
    ).toBe(true)
  })
})
