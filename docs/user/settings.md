# Settings

## The settings file

ConsolX keeps its settings in a text file: `%APPDATA%\ConsolX\settings.json`. To open it, click
**+**, then **Settings**, or press `Ctrl+,`. It opens in the program Windows uses for `.json`
files, such as Notepad or Visual Studio Code.

ConsolX creates the file at its first start, with every setting in it, each with an explanation
and its default value. All of them are turned off by `//` at the start of their line, so the
defaults apply:

```jsonc
// Font size of the terminals, in pixels.
// "terminal.fontSize": 14,
```

To change a setting, remove the `//` in front of it and change its value:

```jsonc
  // Font size of the terminals, in pixels.
  "terminal.fontSize": 16,
```

Then save the file: ConsolX applies the change at once, without restarting.

### Rules of the file

- The text after `//` is a comment, ignored by ConsolX.
- Settings are separated by commas. A comma after the last setting is allowed.
- Texts are written in double quotes: `"Git Bash"`. Numbers are written without them: `16`.

### When something is wrong

If the file has a mistake, a notice tells what is wrong and on which line, for example
`Line 13: a comma is missing`. ConsolX keeps the last good settings until the mistake is fixed.

In Visual Studio Code, the file is checked as you type: each setting shows its explanation, and
mistakes are underlined.

## Settings

### defaultProfile

The shell opened at start and with `Ctrl+Shift+T`: its name, as shown in the **+** menu (upper
or lower case does not matter). A split runs the same shell as the terminal it splits.

```jsonc
  "defaultProfile": "Git Bash",
```

By default, PowerShell 7, or Windows PowerShell when PowerShell 7 is not installed. If no shell has
this name, a notice lists the names you can use.

### closeOnExit

What happens to a tab when its shell ends by itself, after `exit` for example:

| Value                  | The tab...                                                             |
| ---------------------- | ---------------------------------------------------------------------- |
| `"graceful"` (default) | closes if the shell ended without error, and stays open after an error |
| `"always"`             | always closes                                                          |
| `"never"`              | always stays open, with the exit code of the shell                     |

### theme

The colors of ConsolX, for the interface and the terminals:

| Value              | Colors                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| `"dark"` (default) | dark                                                                                                         |
| `"light"`          | light                                                                                                        |
| `"system"`         | follow the light or dark mode of Windows (**Settings**, **Personalization**, **Colors**), and change with it |

### terminal.fontFamily

The font of the terminals: one or more font names, separated by commas. ConsolX uses the first one
installed. Default: `"\"Cascadia Mono\", Consolas, monospace"`.

A font name with spaces is written in quotes, which are preceded by `\` inside the setting:

```jsonc
  "terminal.fontFamily": "\"Fira Code\", Consolas, monospace",
```

### terminal.fontSize

The size of the font of the terminals, in pixels, from 6 to 72. Default: `14`.

### keys.\*

One setting per keyboard shortcut, such as `"keys.newTab": "Ctrl+Shift+T"`. See
[Keyboard shortcuts](shortcuts.md).
