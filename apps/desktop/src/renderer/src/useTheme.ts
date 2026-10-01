// Applies the theme of the settings to the page: the data-theme attribute of the page
// picks the colors (themes/*.css). "system" follows the light or dark mode of Windows,
// and changes with it.
import { createContext, useEffect, useLayoutEffect, useState } from 'react'
import type { ThemeSetting } from '../../shared/settings'

export type ThemeName = 'dark' | 'light'

// The theme in use, for what does not read CSS, such as the terminals of xterm.js.
export const ThemeContext = createContext<ThemeName>('dark')

const darkMode = window.matchMedia('(prefers-color-scheme: dark)')

export function useTheme(setting: ThemeSetting | undefined): ThemeName {
  const [systemDark, setSystemDark] = useState(darkMode.matches)

  useEffect(() => {
    const onChange = () => setSystemDark(darkMode.matches)
    darkMode.addEventListener('change', onChange)
    return () => darkMode.removeEventListener('change', onChange)
  }, [])

  const theme: ThemeName =
    setting === 'light' || (setting === 'system' && !systemDark) ? 'light' : 'dark'

  // Before the effects of the page run, so that they read the colors of the new theme.
  useLayoutEffect(() => {
    document.documentElement.dataset['theme'] = theme
  }, [theme])

  return theme
}
