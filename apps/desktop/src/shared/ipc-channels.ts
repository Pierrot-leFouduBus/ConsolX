// Names of the IPC channels between the main process and the preload script.
export const IpcChannel = {
  // UI -> main
  getAppInfo: 'app:get-info',
  terminalGetProfiles: 'terminal:get-profiles',
  terminalCreate: 'terminal:create',
  terminalWrite: 'terminal:write',
  terminalResize: 'terminal:resize',
  terminalKill: 'terminal:kill',
  updateGetState: 'update:get-state',
  updateDownload: 'update:download',
  updateInstall: 'update:install',
  // main -> UI
  terminalData: 'terminal:data',
  terminalExit: 'terminal:exit',
  updateState: 'update:state'
} as const
