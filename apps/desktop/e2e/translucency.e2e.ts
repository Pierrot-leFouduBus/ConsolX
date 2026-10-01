// Translucent window: each part has the opacity of its setting, painted once.
import { writeFileSync } from 'node:fs'
import { background, expect, terminals, test, TEST_SETTINGS } from './consolx'

test('gives each part of the window the opacity of its setting', async ({
  consolx: { window, settingsFile }
}) => {
  const page = window.locator('html')
  const tabBar = window.locator('.dv-tabs-and-actions-container').first()
  const statusBar = window.locator('.status-bar')
  const opacity = async (element: typeof page) => (await background(element)).alpha
  await expect(page).not.toHaveAttribute('data-translucent')

  writeFileSync(
    settingsFile,
    JSON.stringify({
      ...TEST_SETTINGS,
      'terminal.opacity': 0.5,
      'tabs.opacity': 0.75,
      'window.opacity': 0.25
    })
  )
  await expect(page).toHaveAttribute('data-translucent')
  // The window background is cleared, so that the opacities do not add up.
  expect(await opacity(page)).toBe(0)
  await expect.poll(() => opacity(terminals(window).first())).toBeCloseTo(0.5)
  await expect.poll(() => opacity(tabBar)).toBeCloseTo(0.75)
  await expect.poll(() => opacity(statusBar)).toBeCloseTo(0.25)

  // Back to the default settings: everything is opaque again.
  writeFileSync(settingsFile, JSON.stringify(TEST_SETTINGS))
  await expect(page).not.toHaveAttribute('data-translucent')
  expect(await opacity(page)).toBe(1)
  await expect.poll(() => opacity(terminals(window).first())).toBe(1)
})
