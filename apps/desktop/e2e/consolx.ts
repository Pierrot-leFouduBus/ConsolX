// Starts ConsolX for each end-to-end test, with a settings folder of its own, and gives
// the test the app and its window.
import {
  _electron as electron,
  expect,
  test as base,
  type ElectronApplication,
  type Locator,
  type Page
} from '@playwright/test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

// The desktop app folder: Electron starts the built app from its package.json.
const appDir = resolve(__dirname, '..')

export interface ConsolX {
  app: ElectronApplication
  window: Page
  // The settings file of this test: writing it changes the settings of the app.
  settingsFile: string
}

// Settings of every test: Command Prompt starts fast and exists on every Windows.
export const TEST_SETTINGS = { defaultProfile: 'Command Prompt' }

export const test = base.extend<{ consolx: ConsolX }>({
  // eslint-disable-next-line no-empty-pattern -- Playwright needs the fixtures argument
  consolx: async ({}, use) => {
    const userData = mkdtempSync(join(tmpdir(), 'consolx-e2e-'))
    const settingsFile = join(userData, 'settings.json')
    writeFileSync(settingsFile, JSON.stringify(TEST_SETTINGS))

    const app = await electron.launch({
      // Keep drawing the window when other windows cover it.
      args: [appDir, '--disable-features=CalculateNativeWinOcclusion'],
      env: { ...process.env, CONSOLX_USER_DATA_DIR: userData }
    })
    const window = await app.firstWindow()
    // Ready once the shell shows its prompt: the shortcuts listen by then too.
    // The space after > is the cursor.
    await expect(lines(window).filter({ hasText: />\s*$/ })).toHaveCount(1)

    await use({ app, window, settingsFile })

    // Some tests close the app themselves.
    await app.close().catch(() => undefined)
    rmSync(userData, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
  }
})

export { expect } from '@playwright/test'

// Tabs, groups of tabs and terminals of the window.
export const tabs = (window: Page): Locator => window.locator('.tab')
export const groups = (window: Page): Locator => window.locator('.dv-groupview')
export const terminals = (window: Page): Locator => window.locator('.terminal-view')

// Lines shown in the terminals. Only these: xterm also keeps hidden text to measure
// characters, which would match anything typed.
export const lines = (window: Page): Locator => window.locator('.terminal-view .xterm-rows > div')

// Opens the + menu of the first group of tabs and clicks one of its entries.
export async function chooseInMenu(window: Page, entry: string): Promise<void> {
  await window.getByRole('button', { name: 'New terminal' }).first().click()
  await window.getByRole('menuitem', { name: entry, exact: true }).click()
}
