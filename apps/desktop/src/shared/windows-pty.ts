// How node-pty runs shells on Windows, and what xterm.js needs to show their output right.
export interface WindowsPty {
  backend: 'conpty' | 'winpty'
  // Windows build whose ConPTY behaves the same, for example 19045 for Windows 10 22H2.
  buildNumber: number
}

// From the Windows version, for example "10.0.19045". node-pty uses ConPTY from build
// 18309 and winpty before it. ConsolX runs the ConPTY shipped with node-pty, which is
// recent: like the one of Windows from build 21376, it lets the terminal rewrap lines.
export function windowsPty(systemVersion: string): WindowsPty | undefined {
  const buildNumber = Number(systemVersion.split('.')[2])
  if (!Number.isInteger(buildNumber) || buildNumber <= 0) return undefined
  if (buildNumber < 18309) return { backend: 'winpty', buildNumber }
  return { backend: 'conpty', buildNumber: Math.max(buildNumber, 21376) }
}

// ConPTY scrolls the whole screen with "scroll up" (CSI n S) when a program scrolls the
// console through its API, as PowerShell's PSReadLine does after each command. xterm.js
// drops the lines that leave the screen that way, so this rewrites the sequence as
// newlines on the last row, which keep them in the history. ConPTY draws the screen
// itself, so it never relies on the saved cursor used here.
export class ConptyScrollFix {
  // End of the previous output when it stopped in the middle of an escape sequence.
  private pending = ''
  // Scroll margins set by a program: newlines on the last row would not match them.
  private margins = false

  rewrite(data: string): string {
    const text = this.pending + data
    // eslint-disable-next-line no-control-regex -- escape sequences start with ESC
    const cut = text.search(/\x1b(\[[\d;]*)?$/)
    this.pending = cut < 0 ? '' : text.slice(cut)
    const complete = cut < 0 ? text : text.slice(0, cut)
    return complete.replace(
      // eslint-disable-next-line no-control-regex -- escape sequences start with ESC
      /\x1b\[(\d*)S|\x1b\[([\d;]*)r/g,
      (sequence, count?: string, margins?: string) => {
        if (margins !== undefined) {
          this.margins = !['', ';', '1', '1;'].includes(margins)
          return sequence
        }
        if (this.margins) return sequence
        // Save the cursor, go to the last row (9999 is clamped to it), add lines, come back.
        return `\x1b7\x1b[9999;1H${'\n'.repeat(Number(count) || 1)}\x1b8`
      }
    )
  }
}
