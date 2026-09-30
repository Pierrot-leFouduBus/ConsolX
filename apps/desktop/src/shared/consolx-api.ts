// Shape of the API that the preload script exposes to the UI as `window.consolx`.
// Shared by the preload (which builds it) and the renderer (which uses it).

// Stops listening to an event.
export type Unsubscribe = () => void

// A shell the user can open, for example "Windows PowerShell" or "Ubuntu" (WSL).
export interface ShellProfile {
  id: string
  name: string
}

export interface ShellProfiles {
  profiles: ShellProfile[]
  // Profile opened when none is chosen; null when no shell was found.
  defaultId: string | null
}

export interface TerminalApi {
  // Shells found on this computer.
  getProfiles(): Promise<ShellProfiles>
  // Starts a shell in a new terminal of the given size and returns the terminal id.
  // A null profile opens the default one.
  create(profileId: string | null, cols: number, rows: number): Promise<number>
  // Sends keyboard input to the shell.
  write(id: number, data: string): void
  // Tells the shell the new terminal size.
  resize(id: number, cols: number, rows: number): void
  // Stops the shell.
  kill(id: number): void
  // Receives the output of every shell.
  onData(listener: (id: number, data: string) => void): Unsubscribe
  // Called when a shell exits.
  onExit(listener: (id: number, exitCode: number) => void): Unsubscribe
}

export interface AppInfo {
  // "ConsolX", or "ConsolX Dev" for the development variant.
  name: string
  // For example "0.1.0", or "0.2.0-dev.1".
  version: string
}

// Where the app is with updates. The main process owns this state and sends every change.
export type UpdateState =
  // Nothing to show: no update, not checked yet, or running in development.
  | { status: 'idle' }
  // A newer version exists. `failed` is set when its download has failed.
  | { status: 'available'; version: string; failed?: boolean }
  | { status: 'downloading'; version: string; percent: number }
  // Downloaded: installs on restart, or when the app quits.
  | { status: 'ready'; version: string }

export interface UpdatesApi {
  getState(): Promise<UpdateState>
  // Downloads the available update in the background.
  download(): void
  // Quits, installs the downloaded update and starts the new version.
  install(): void
  onState(listener: (state: UpdateState) => void): Unsubscribe
}

export interface ConsolxApi {
  getAppInfo(): Promise<AppInfo>
  terminal: TerminalApi
  updates: UpdatesApi
}
