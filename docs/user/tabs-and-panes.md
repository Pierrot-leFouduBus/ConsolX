# Tabs, panes and shells

## Shells

ConsolX finds the shells installed on your computer:

| Shell                                      | Found when installed in                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| PowerShell (version 7)                     | `C:\Program Files\PowerShell\7`, or from the Microsoft Store                                 |
| PowerShell Preview                         | `C:\Program Files\PowerShell\7-preview`                                                      |
| Windows PowerShell                         | Always there on Windows                                                                      |
| Command Prompt                             | Always there on Windows                                                                      |
| Git Bash                                   | `C:\Program Files\Git`, `C:\Program Files (x86)\Git`, or Git installed for your account only |
| Your WSL distributions (Ubuntu, Debian...) | Each distribution listed by `wsl --list`                                                     |

The **+** menu lists them. ConsolX opens **PowerShell 7** at start and with `Ctrl+Shift+T`, or
**Windows PowerShell** when PowerShell 7 is not installed. To open another shell by default, set
[`defaultProfile`](settings.md#defaultprofile) in the settings.

## Tabs

- **Open a tab**: click **+** at the right of the tabs and choose a shell, or press `Ctrl+Shift+T`
  for the default shell.
- **Rename a tab**: double-click it, type the new name, then press `Enter`. `Escape` keeps the old
  name.
- **Close a tab**: click its **×**, click it with the middle mouse button, or press
  `Ctrl+Shift+W`. Closing a tab stops its shell.
- **Reorder tabs**: drag a tab to its new place.
- **Go from tab to tab**: click a tab, or press `Ctrl+Tab` and `Ctrl+Shift+Tab`.

A shell keeps running when its tab is not shown.

When a shell ends by itself (after `exit`, for example), its tab closes if the shell ended without
error, and stays open after an error so that you can read the message. The
[`closeOnExit`](settings.md#closeonexit) setting changes this.

## Split panes

A window can show several terminals side by side, each pane with its own tabs.

- **Split**: in the **+** menu, choose **Split right** or **Split down**, or press `Alt+Shift+=`
  or `Alt+Shift+-`. The new terminal runs the same shell as the active one.
- **Split by dragging**: drag a tab onto the edge of a terminal. A highlighted area shows where it
  will go.
- **Move a tab to another pane**: drag it onto the tabs of that pane.
- **Resize panes**: drag the line between them.
- **Go to another pane**: click in it, or press `Alt` with an arrow key.

## Copy and paste

- **Copy**: select text with the mouse (a double click selects a word), then press `Ctrl+C` or
  `Ctrl+Shift+C`. When no text is selected, `Ctrl+C` goes to the shell as usual, to stop the
  command running.
- **Paste**: press `Ctrl+V` or `Ctrl+Shift+V`.

## The window

ConsolX draws its own title bar: the empty space at the right of the tabs.

- Drag it to move the window, and double-click it to maximize or restore the window.
- Drag the window against an edge of the screen to snap it, as with any Windows app.
- Closing the last tab closes the window.

The status bar, at the bottom of the window, shows the version of ConsolX and the progress of
updates.
