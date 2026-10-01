// Names of the IPC channels between the main process and the preload script.
export const IpcChannel = {
  // UI -> main
  getAppInfo: 'app:get-info',
  settingsGetState: 'settings:get-state',
  settingsOpen: 'settings:open',
  terminalGetProfiles: 'terminal:get-profiles',
  terminalCreate: 'terminal:create',
  terminalWrite: 'terminal:write',
  terminalResize: 'terminal:resize',
  terminalKill: 'terminal:kill',
  updateGetState: 'update:get-state',
  updateDownload: 'update:download',
  updateInstall: 'update:install',
  windowMinimize: 'window:minimize',
  windowToggleMaximize: 'window:toggle-maximize',
  windowClose: 'window:close',
  windowIsMaximized: 'window:is-maximized',
  // main -> UI
  settingsState: 'settings:state',
  terminalData: 'terminal:data',
  terminalExit: 'terminal:exit',
  updateState: 'update:state',
  windowMaximizedChange: 'window:maximized-change'
} as const
