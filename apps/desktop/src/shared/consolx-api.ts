// Shape of the API that the preload script exposes to the UI as `window.consolx`.
// Shared by the preload (which builds it) and the renderer (which uses it).

// Stops listening to an event.
export type Unsubscribe = () => void

export interface TerminalApi {
  // Starts a shell in a new terminal of the given size and returns the terminal id.
  create(cols: number, rows: number): Promise<number>
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

export interface ConsolxApi {
  getAppInfo(): Promise<AppInfo>
  terminal: TerminalApi
}
