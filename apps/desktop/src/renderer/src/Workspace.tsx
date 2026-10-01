// Tabs and split panes of terminals, laid out by dockview. Tabs can be dragged to
// reorder them, move them to another group, or split a group by dropping on its edge.
import {
  DockviewReact,
  themeDark,
  type DockviewApi,
  type DockviewReadyEvent,
  type IDockviewPanelProps
} from 'dockview-react'
import 'dockview-react/dist/styles/dockview.css'
import { useEffect, useState } from 'react'
import type { ShellProfiles } from '../../shared/consolx-api'
import { NewTerminalMenu } from './NewTerminalMenu'
import { TerminalTab } from './TerminalTab'
import { TerminalView } from './TerminalView'
import { defaultShell, openTerminal, ShellsContext, type TerminalParams } from './terminals'
import { trackTitleBar } from './titleBar'
import { useSettings } from './useSettings'
import { useShortcuts } from './useShortcuts'

// Content of a terminal panel.
function TerminalPanel({ api, params }: IDockviewPanelProps<TerminalParams>) {
  const [active, setActive] = useState(api.isActive)
  // Counts the requests to focus the panel, for example after renaming its tab.
  const [focusRequests, setFocusRequests] = useState(0)
  const { closeOnExit } = useSettings()

  useEffect(() => {
    const activeListener = api.onDidActiveChange((event) => setActive(event.isActive))
    const focusListener = api.onWillFocus(() => setFocusRequests((count) => count + 1))
    return () => {
      activeListener.dispose()
      focusListener.dispose()
    }
  }, [api])

  return (
    <TerminalView
      panelId={api.id}
      profileId={params.profileId}
      active={active}
      focusRequests={focusRequests}
      // By default ("graceful"), a shell that ends normally closes its tab; after an
      // error, the tab stays open so that its message can be read.
      onExit={(exitCode) => {
        if (closeOnExit === 'always' || (closeOnExit === 'graceful' && exitCode === 0)) {
          api.close()
        }
      }}
    />
  )
}

const components = { terminal: TerminalPanel }

interface WorkspaceProps {
  shells: ShellProfiles
}

export function Workspace({ shells }: WorkspaceProps) {
  const { defaultProfile } = useSettings()
  // The workspace once dockview has created it, for the shortcuts.
  const [api, setApi] = useState<DockviewApi>()
  useShortcuts(api, shells)

  const onReady = ({ api }: DockviewReadyEvent) => {
    setApi(api)
    const shell = defaultShell(shells, defaultProfile)
    if (shell) openTerminal(api, shell)
    trackTitleBar(api)

    // Closing the last terminal closes the window. Checked a moment later, since
    // moving a tab also removes it for an instant.
    api.onDidRemovePanel(() => {
      setTimeout(() => {
        if (api.totalPanels === 0) window.close()
      })
    })
  }

  return (
    <ShellsContext.Provider value={shells}>
      <DockviewReact
        className="workspace"
        theme={themeDark}
        components={components}
        defaultTabComponent={TerminalTab}
        rightHeaderActionsComponent={NewTerminalMenu}
        // Keep terminals of hidden tabs alive, instead of rebuilding them.
        defaultRenderer="always"
        // No drop on the outer edges of the layout: along the top, it would catch tabs
        // dropped on the title bar. Dropping on the edge of a terminal still splits it.
        dndEdges={false}
        onReady={onReady}
      />
    </ShellsContext.Provider>
  )
}
