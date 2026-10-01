// Themes: chosen in the settings file, applied at once to the interface and the terminals.
import { writeFileSync } from 'node:fs'
import { expect, terminals, test, TEST_SETTINGS } from './consolx'

// Colors of themes/light.css, as the page computes them.
const LIGHT_BACKGROUND = 'rgb(247, 245, 240)'
const LIGHT_TEXT = 'rgb(31, 34, 41)'

test('switches to the light theme when the settings file changes', async ({
  consolx: { window, settingsFile }
}) => {
  const page = window.locator('html')
  await expect(page).toHaveAttribute('data-theme', 'dark')

  writeFileSync(settingsFile, JSON.stringify({ ...TEST_SETTINGS, theme: 'light' }))
  await expect(page).toHaveAttribute('data-theme', 'light')
  await expect(terminals(window).first()).toHaveCSS('background-color', LIGHT_BACKGROUND)
  // xterm.js gets the colors of the new theme too: it draws the text of the terminal.
  await expect(window.locator('.xterm-rows').first()).toHaveCSS('color', LIGHT_TEXT)
})

test('"system" follows the light or dark mode of Windows', async ({
  consolx: { window, settingsFile }
}) => {
  const page = window.locator('html')
  await window.emulateMedia({ colorScheme: 'light' })
  writeFileSync(settingsFile, JSON.stringify({ ...TEST_SETTINGS, theme: 'system' }))
  await expect(page).toHaveAttribute('data-theme', 'light')

  await window.emulateMedia({ colorScheme: 'dark' })
  await expect(page).toHaveAttribute('data-theme', 'dark')
})
