// Opens a file with the program Windows uses for its type: the settings file opens in
// the user's editor, for example.
import { shell } from 'electron'
import koffi from 'koffi'

// Windows only lets the active app bring a window to the front. When the user asks to
// open a file, ConsolX is the active app: it passes this right on to the editor it
// starts, which would otherwise open behind ConsolX.
const ASFW_ANY = 0xffffffff

// Windows API function, loaded on first use: user32.dll only exists on Windows.
let allowSetForegroundWindow: ((processId: number) => boolean) | undefined

export async function openFile(path: string): Promise<void> {
  if (process.platform === 'win32') {
    allowSetForegroundWindow ??= koffi
      .load('user32.dll')
      .func('bool __stdcall AllowSetForegroundWindow(uint32 processId)')
    allowSetForegroundWindow(ASFW_ANY)
  }
  const error = await shell.openPath(path)
  if (error) console.error(`Cannot open ${path}: ${error}`)
}
