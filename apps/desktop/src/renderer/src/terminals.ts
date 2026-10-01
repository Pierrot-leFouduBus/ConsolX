// What the workspace, its tabs and its menus share: the shells found on this computer,
// and how to open a terminal.
import type { AddPanelPositionOptions, DockviewApi } from 'dockview-react'
import { createContext } from 'react'
import type { ShellProfile, ShellProfiles } from '../../shared/consolx-api'

// Parameters of a terminal panel.
export interface TerminalParams {
  profileId: string
}

export const ShellsContext = createContext<ShellProfiles>({ profiles: [], defaultId: null })

let nextPanelId = 1

// Opens a terminal running the given shell: as a new tab of a group, or next to it.
export function openTerminal(
  api: DockviewApi,
  profile: ShellProfile,
  position?: AddPanelPositionOptions
): void {
  api.addPanel<TerminalParams>({
    id: `terminal-${nextPanelId++}`,
    component: 'terminal',
    title: profile.name,
    params: { profileId: profile.id },
    position
  })
}

// The shell named in the settings (by its name, whatever the case, or by its id), else
// the default shell, else the first one found.
export function defaultShell(
  shells: ShellProfiles,
  preferred: string | undefined
): ShellProfile | undefined {
  return (
    findShell(shells, preferred) ??
    shells.profiles.find((profile) => profile.id === shells.defaultId) ??
    shells.profiles[0]
  )
}

export function findShell(
  shells: ShellProfiles,
  name: string | undefined
): ShellProfile | undefined {
  const wanted = name?.trim().toLowerCase()
  if (!wanted) return undefined
  return shells.profiles.find(
    (profile) => profile.name.toLowerCase() === wanted || profile.id.toLowerCase() === wanted
  )
}
