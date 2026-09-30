// The tab bars at the top of the window act as its title bar, as in Windows Terminal:
// their empty space moves the window (a double-click maximizes it), and the tab bar in
// the top right corner leaves room for the window buttons. The CSS does the rest, from
// the classes set here.
import type { DockviewApi } from 'dockview-react'

// Allowance for fractional pixels with display scaling.
const TOLERANCE = 1

// Keeps the classes up to date as groups are added, moved, split or removed. Resizing
// the window does not change which groups are at the top, so it needs no update.
export function trackTitleBar(api: DockviewApi): void {
  const update = () => {
    const groups = api.groups
      .filter((group) => group.api.location.type === 'grid')
      .map((group) => ({ element: group.element, box: group.element.getBoundingClientRect() }))
    const top = Math.min(...groups.map(({ box }) => box.top))
    const right = Math.max(...groups.map(({ box }) => box.right))
    for (const { element, box } of groups) {
      const atTop = box.top - top < TOLERANCE
      element.classList.toggle('title-bar-group', atTop)
      element.classList.toggle('window-buttons-group', atTop && right - box.right < TOLERANCE)
    }
  }

  update()
  api.onDidLayoutChange(update)

  // While a tab is dragged, the empty space must accept its drop instead of moving the
  // window. The dragged tab may be gone when the drag ends, hence also "drop".
  const root = document.documentElement
  window.addEventListener('dragstart', () => root.classList.add('dragging-tab'), true)
  for (const name of ['dragend', 'drop']) {
    window.addEventListener(name, () => root.classList.remove('dragging-tab'), true)
  }
}
