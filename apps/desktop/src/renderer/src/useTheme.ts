// Applies the look chosen by the user to the page: the theme of the settings, whose
// data-theme attribute picks the colors (themes/*.css), then the user CSS file on top.
// "system" follows the light or dark mode of Windows, and changes with it.
import { createContext, useEffect, useLayoutEffect, useState } from 'react'
import type { ThemeSetting } from '../../shared/settings'

export type ThemeName = 'dark' | 'light'

// A key that changes each time the colors may have changed, for what does not read CSS,
// such as the terminals of xterm.js.
export const ThemeContext = createContext('')

const darkMode = window.matchMedia('(prefers-color-scheme: dark)')

export function useTheme(setting: ThemeSetting | undefined, userCss: string): string {
  const [systemDark, setSystemDark] = useState(darkMode.matches)

  useEffect(() => {
    const onChange = () => setSystemDark(darkMode.matches)
    darkMode.addEventListener('change', onChange)
    return () => darkMode.removeEventListener('change', onChange)
  }, [])

  const theme: ThemeName =
    setting === 'light' || (setting === 'system' && !systemDark) ? 'light' : 'dark'

  // Before the effects of the page run, so that they read the new colors.
  useLayoutEffect(() => {
    document.documentElement.dataset['theme'] = theme
    userStyle().textContent = userCss
  }, [theme, userCss])

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
