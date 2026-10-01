# Keyboard shortcuts

## Default shortcuts

ConsolX uses the shortcuts of Windows Terminal by default.

| Action                                | Shortcut         | Setting             |
| ------------------------------------- | ---------------- | ------------------- |
| Open a new tab with the default shell | `Ctrl+Shift+T`   | `keys.newTab`       |
| Close the active tab                  | `Ctrl+Shift+W`   | `keys.closeTab`     |
| Go to the next tab                    | `Ctrl+Tab`       | `keys.nextTab`      |
| Go to the previous tab                | `Ctrl+Shift+Tab` | `keys.previousTab`  |
| Split: a new terminal on the right    | `Alt+Shift+=`    | `keys.splitRight`   |
| Split: a new terminal below           | `Alt+Shift+-`    | `keys.splitDown`    |
| Go to the terminal on the left        | `Alt+Left`       | `keys.focusLeft`    |
| Go to the terminal on the right       | `Alt+Right`      | `keys.focusRight`   |
| Go to the terminal above              | `Alt+Up`         | `keys.focusUp`      |
| Go to the terminal below              | `Alt+Down`       | `keys.focusDown`    |
| Copy the selected text                | `Ctrl+Shift+C`   | `keys.copy`         |
| Paste                                 | `Ctrl+Shift+V`   | `keys.paste`        |
| Open the settings file                | `Ctrl+,`         | `keys.openSettings` |

`Ctrl+Tab` and `Ctrl+Shift+Tab` go from tab to tab within the active pane.

### Ctrl+C and Ctrl+V

As in Windows Terminal:

- `Ctrl+C` copies when text is selected. When no text is selected, it goes to the shell as usual,
  to stop the command running.
- `Ctrl+V` pastes.

Turning off the copy or paste shortcut (see below) turns these off too: `Ctrl+C` and `Ctrl+V`
then always go to the shell.

## Change a shortcut

Each shortcut is a setting of the [settings file](settings.md). To change one, add its line, or
remove the `//` in front of it, and write the new keys:

```jsonc
  "keys.newTab": "Ctrl+Alt+N",
```

Save the file: the new shortcut works at once, and the **+** menu shows it.

### How to write a shortcut

A shortcut is one or more modifiers, then a key, joined by `+`:

- **Modifiers**: `Ctrl`, `Alt` and `Shift`. A shortcut needs `Ctrl` or `Alt`, so that typing text
  never triggers it. Only the function keys, `F1` to `F24`, can be used alone.
- **Key**: the character the key types, such as `T`, `=`, `,` or `5`, or one of these names:
  `Tab`, `Enter`, `Escape`, `Space`, `Backspace`, `Delete`, `Insert`, `Home`, `End`, `PageUp`,
  `PageDown`, `Left`, `Right`, `Up`, `Down`, `F1` to `F24`. `Plus` and `Minus` can be used for
  `+` and `-`.

Upper or lower case does not matter: `ctrl+shift+t` is the same as `Ctrl+Shift+T`.

The key is the one of your keyboard layout. With `Shift`, write the character the key types
without `Shift`: `Alt+Shift+=` is the `=` key, even though `Shift` makes it type `+`.

### Turn a shortcut off

Set it to an empty text:

```jsonc
  "keys.closeTab": "",
```

The keys then go to the shell, like any other keys.

### Keys used by ConsolX

The keys of a shortcut never reach the shell. If a program in your terminal needs one of them,
`Alt+Left` for example, change or turn off that shortcut.
