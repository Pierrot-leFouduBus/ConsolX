// Tabs and split panes of terminals, laid out by dockview. Tabs can be dragged to
// reorder them, move them to another group, or split a group by dropping on its edge.
import {
  DockviewReact,
  themeDark,
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

// Content of a terminal panel.
function TerminalPanel({ api, params }: IDockviewPanelProps<TerminalParams>) {
  const [active, setActive] = useState(api.isActive)

  useEffect(() => {
    const listener = api.onDidActiveChange((event) => setActive(event.isActive))
    return () => listener.dispose()
  }, [api])

  return (
    <TerminalView
      profileId={params.profileId}
      active={active}
      // A shell that ends normally closes its tab; after an error, the tab stays
      // open so that its message can be read.
      onExit={(exitCode) => {
        if (exitCode === 0) api.close()
      }}
    />
  )
}

const components = { terminal: TerminalPanel }

interface WorkspaceProps {
  shells: ShellProfiles
}

export function Workspace({ shells }: WorkspaceProps) {
  const onReady = ({ api }: DockviewReadyEvent) => {
    const shell = defaultShell(shells)
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
