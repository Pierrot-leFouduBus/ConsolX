// Names of the IPC channels between the main process and the preload script.
export const IpcChannel = {
  // UI -> main
  getAppInfo: 'app:get-info',
  terminalCreate: 'terminal:create',
  terminalWrite: 'terminal:write',
  terminalResize: 'terminal:resize',
  terminalKill: 'terminal:kill',
  updateGetState: 'update:get-state',
  updateDownload: 'update:download',
  updateInstall: 'update:install',
  protoGetSettings: 'proto:get-settings',
  protoRecreate: 'proto:recreate',
  protoUpdate: 'proto:update',
  protoGetInfo: 'proto:get-info',
  windowMinimize: 'window:minimize',
  windowToggleMaximize: 'window:toggle-maximize',
  windowClose: 'window:close',
  // main -> UI
  terminalData: 'terminal:data',
  terminalExit: 'terminal:exit',
  updateState: 'update:state',
  protoInfo: 'proto:info'
} as const
