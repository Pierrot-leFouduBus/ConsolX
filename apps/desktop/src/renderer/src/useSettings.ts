// Follows the settings, as read by the main process from settings.json, and shares them
// with every part of the UI.
import { createContext, useContext, useEffect, useState } from 'react'
import type { SettingsState } from '../../shared/consolx-api'
import type { Settings } from '../../shared/settings'

// Undefined until the main process has sent them.
export function useSettingsState(): SettingsState | undefined {
  const [state, setState] = useState<SettingsState>()

  useEffect(() => {
    const settings = window.consolx.settings
    // Listen first, then ask for the current state, so no change is missed.
    const stop = settings.onState(setState)
    void settings.getState().then(setState)
    return stop
  }, [])

  return state
}

export const SettingsContext = createContext<Settings | undefined>(undefined)

// The settings in use, inside a SettingsContext.
export function useSettings(): Settings {
  const settings = useContext(SettingsContext)
  if (!settings) throw new Error('useSettings is used outside of SettingsContext')
  return settings
}
