# Themes and user CSS

## Choose a theme

ConsolX has a dark theme, used by default, and a light theme. The
[`theme`](settings.md#theme) setting chooses one, or follows the light or dark mode of Windows
with `"system"`.

## Translucent window

The terminals, the tab bars and the status bar can each let the desktop show through, blurred:
see the [opacity settings](settings.md#terminalopacity-tabsopacity-and-windowopacity).

## The user CSS file

To change the look of ConsolX further, write CSS in `%APPDATA%\ConsolX\user.css`, next to the
settings file. ConsolX creates it at its first start, with examples in comments, and applies it
on top of the theme as soon as you save it.

The look of ConsolX comes from variables, such as `--cx-accent` for the accent color. Give them
other values in `user.css`:

```css
/* In every theme. */
:root {
  --cx-accent: #e6c07b;
}

/* In the light theme only. */
:root[data-theme='light'] {
  --cx-terminal-bg: #ffffff;
}
```

A rule on `:root` wins over every theme. To change a theme only, write
`:root[data-theme='dark']` or `:root[data-theme='light']`.

Colors can be written in any CSS form: `#e6c07b`, `rgb(230, 192, 123)`, and with transparency,
`rgba(230, 192, 123, 0.5)` or `#e6c07b80`.

`user.css` cannot load files from the internet, such as web fonts: use fonts installed on your
computer. Prefer the variables to other CSS rules: they stay the same from one version of ConsolX
to the next, while the rest of the interface may change.

## Variables

### Window and interface

| Variable              | What it colors                                             |
| --------------------- | ---------------------------------------------------------- |
| `--cx-window-bg`      | Background of the window, under everything else            |
| `--cx-surface`        | Tab bars, menus, dialogs and notices                       |
| `--cx-tab-active-bg`  | The tab shown in each pane                                 |
| `--cx-fg`             | Text                                                       |
| `--cx-fg-muted`       | Secondary text, such as hidden tabs and shortcuts in menus |
| `--cx-fg-faint`       | Hidden tabs of the panes that are not active               |
| `--cx-border`         | Borders, separators, and the background of hovered items   |
| `--cx-accent`         | Focus, primary buttons, and where a dragged tab will go    |
| `--cx-on-accent`      | Text on the accent color                                   |
| `--cx-accent-soft`    | Area where a dragged tab will go                           |
| `--cx-danger`         | Close button of the window, when hovered                   |
| `--cx-on-danger`      | The × of the close button, when hovered                    |
| `--cx-danger-pressed` | Close button of the window, when pressed                   |
| `--cx-shadow`         | Shadow under menus and notices (a CSS `box-shadow`)        |
| `--cx-backdrop`       | Behind dialogs                                             |

### Terminals

| Variable                    | What it colors                     |
| --------------------------- | ---------------------------------- |
| `--cx-terminal-bg`          | Background of the terminals        |
| `--cx-terminal-fg`          | Text                               |
| `--cx-terminal-cursor`      | Cursor                             |
| `--cx-terminal-cursor-text` | Character under the cursor         |
| `--cx-terminal-selection`   | Selected text                      |
| `--cx-terminal-padding`     | Space around the text (a CSS size) |

The 16 colors that programs use in the terminals: `--cx-terminal-black`, `-red`, `-green`,
`-yellow`, `-blue`, `-magenta`, `-cyan` and `-white`, and their bright versions:
`--cx-terminal-bright-black`, `-bright-red`, and so on.

### Fonts and sizes

| Variable                    | What it sets                                      |
| --------------------------- | ------------------------------------------------- |
| `--cx-font`                 | Font of the interface (not of the terminals)      |
| `--cx-font-size-small`      | Tabs and status bar                               |
| `--cx-font-size`            | Menus and notices                                 |
| `--cx-font-size-large`      | Dialogs                                           |
| `--cx-font-size-title`      | Titles of dialogs                                 |
| `--cx-radius-small`         | Rounded corners of buttons and fields             |
| `--cx-radius`               | Rounded corners of menus                          |
| `--cx-radius-large`         | Rounded corners of dialogs and notices            |
| `--cx-tab-bar-height`       | Height of the tab bars                            |
| `--cx-window-buttons-width` | Width of the minimize, maximize and close buttons |

The font of the terminals is a setting: [`terminal.fontFamily`](settings.md#terminalfontfamily)
and [`terminal.fontSize`](settings.md#terminalfontsize).
