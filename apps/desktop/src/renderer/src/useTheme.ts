// Applies the look chosen by the user to the page: the theme of the settings, whose
// data-theme attribute picks the colors (themes/*.css), the opacity of each part of the
// window, then the user CSS file on top. "system" follows the light or dark mode of
// Windows, and changes with it.
import { createContext, useEffect, useLayoutEffect, useState } from 'react'
import { isTranslucent, type Settings } from '../../shared/settings'

export type ThemeName = 'dark' | 'light'

// A key that changes each time the colors may have changed, for what does not read CSS,
// such as the terminals of xterm.js.
export const ThemeContext = createContext('')

const darkMode = window.matchMedia('(prefers-color-scheme: dark)')

export function useTheme(settings: Settings | undefined, userCss: string): string {
  const [systemDark, setSystemDark] = useState(darkMode.matches)

  useEffect(() => {
    const onChange = () => setSystemDark(darkMode.matches)
    darkMode.addEventListener('change', onChange)
    return () => darkMode.removeEventListener('change', onChange)
  }, [])

  const setting = settings?.theme
  const theme: ThemeName =
    setting === 'light' || (setting === 'system' && !systemDark) ? 'light' : 'dark'
  const terminalOpacity = settings?.terminal.opacity ?? 1
  const tabsOpacity = settings?.tabs.opacity ?? 1
  const windowOpacity = settings?.window.opacity ?? 1
  const translucent = settings !== undefined && isTranslucent(settings)

  // Before the effects of the page run, so that they read the new colors.
  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset['theme'] = theme
    root.style.setProperty('--cx-terminal-opacity', String(terminalOpacity))
    root.style.setProperty('--cx-tabs-opacity', String(tabsOpacity))
    root.style.setProperty('--cx-window-opacity', String(windowOpacity))
    // The window background is cleared: each part paints its own (see styles.css).
    root.toggleAttribute('data-translucent', translucent)
    userStyle().textContent = userCss
  }, [theme, terminalOpacity, tabsOpacity, windowOpacity, translucent, userCss])

  return `${theme}:${userCss}`
}

// The style element of the user CSS file. It comes last in the page, after the styles
// of the app, so that it wins over them.
function userStyle(): HTMLStyleElement {
  let style = document.getElementById('user-css') as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = 'user-css'
    document.head.append(style)
  }
  return style
}
