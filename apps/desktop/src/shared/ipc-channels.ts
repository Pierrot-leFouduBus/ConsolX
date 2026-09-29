// Names of the IPC channels between the main process and the preload script.
export const IpcChannel = {
  // UI -> main
  getVersion: 'app:get-version',
  terminalCreate: 'terminal:create',
  terminalWrite: 'terminal:write',
  terminalResize: 'terminal:resize',
  terminalKill: 'terminal:kill',
  // main -> UI
  terminalData: 'terminal:data',
  terminalExit: 'terminal:exit'
} as const
