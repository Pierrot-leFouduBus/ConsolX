// Default keyboard shortcuts: tabs, splits, moving between terminals, copy and paste.
import { writeFileSync } from 'node:fs'
import { expect, groups, lines, tabs, test, TEST_SETTINGS } from './consolx'

test('opens and closes tabs with Ctrl+Shift+T and Ctrl+Shift+W', async ({
  consolx: { window }
}) => {
  await expect(tabs(window)).toHaveCount(1)
  await window.keyboard.press('Control+Shift+T')
  await expect(tabs(window)).toHaveCount(2)
  await window.keyboard.press('Control+Shift+W')
  await expect(tabs(window)).toHaveCount(1)
})

test('goes from tab to tab with Ctrl+Tab and Ctrl+Shift+Tab', async ({ consolx: { window } }) => {
  const dockviewTabs = window.locator('.dv-tab')
  await window.keyboard.press('Control+Shift+T')
  await expect(dockviewTabs.nth(1)).toHaveClass(/dv-active-tab/)
  // From the last tab, the next one is the first.
  await window.keyboard.press('Control+Tab')
  await expect(dockviewTabs.nth(0)).toHaveClass(/dv-active-tab/)
  await window.keyboard.press('Control+Shift+Tab')
  await expect(dockviewTabs.nth(1)).toHaveClass(/dv-active-tab/)
})

test('splits with Alt+Shift+= and Alt+Shift+-, and moves with Alt+arrows', async ({
  consolx: { window }
}) => {
  await window.keyboard.press('Alt+Shift+Equal')
  await expect(groups(window)).toHaveCount(2)
  // The new terminal, on the right, is the active one.
  await expect(groups(window).nth(1)).toHaveClass(/dv-active-group/)
  await window.keyboard.press('Alt+ArrowLeft')
  await expect(groups(window).nth(0)).toHaveClass(/dv-active-group/)
  await window.keyboard.press('Alt+ArrowRight')
  await expect(groups(window).nth(1)).toHaveClass(/dv-active-group/)

  // The minus key of the number pad types "-" whatever the keyboard layout.
  await window.keyboard.press('Alt+Shift+NumpadSubtract')
  await expect(groups(window)).toHaveCount(3)
  await window.keyboard.press('Alt+ArrowUp')
  await expect(groups(window).nth(1)).toHaveClass(/dv-active-group/)
})

test('without a selection, Ctrl+C still goes to the shell', async ({ consolx: { window } }) => {
  await window.keyboard.type('abc')
  // The shell drops the line typed: the next command runs alone.
  await window.keyboard.press('Control+C')
  await window.keyboard.type('set /a 2*2')
  await window.keyboard.press('Enter')
  await expect(lines(window).filter({ hasText: /^4\s*$/ })).toHaveCount(1)
})

test('copies the selection with Ctrl+C and pastes with Ctrl+V', async ({
  consolx: { app, window }
}) => {
  // Keep the clipboard of the person running the tests.
  const saved = await app.evaluate(({ clipboard }) => clipboard.readText())
  try {
    await expect(lines(window).first()).toContainText('Microsoft Windows')
    // A double click selects the first word. xterm.js takes the mouse over its lines.
    const firstLine = await lines(window).first().boundingBox()
    if (!firstLine) throw new Error('The first line is not shown')
    await window.mouse.dblclick(firstLine.x + 20, firstLine.y + firstLine.height / 2)
    await window.keyboard.press('Control+C')
    await expect.poll(() => app.evaluate(({ clipboard }) => clipboard.readText())).toBe('Microsoft')

    await app.evaluate(({ clipboard }) => clipboard.writeText('echo pasted-ok'))
    await window.keyboard.press('Control+V')
    await window.keyboard.press('Enter')
    await expect(lines(window).filter({ hasText: /^pasted-ok\s*$/ })).toHaveCount(1)
  } finally {
    await app.evaluate(({ clipboard }, text) => clipboard.writeText(text), saved)
  }
})

test('uses a shortcut changed in the settings file at once', async ({
  consolx: { window, settingsFile }
}) => {
  writeFileSync(settingsFile, JSON.stringify({ ...TEST_SETTINGS, 'keys.newTab': 'Ctrl+Alt+N' }))
  // The + menu shows the new shortcut once the app has read the file.
  await window.getByRole('button', { name: 'New terminal' }).click()
  await expect(window.getByRole('menuitem', { name: 'Command Prompt' })).toHaveAttribute(
    'aria-keyshortcuts',
    'Ctrl+Alt+N'
  )
  await window.keyboard.press('Escape')

  await window.keyboard.press('Control+Alt+N')
  await expect(tabs(window)).toHaveCount(2)
  // The old shortcut does nothing anymore.
  await window.keyboard.press('Control+Shift+T')
  await expect(tabs(window)).toHaveCount(2)
})
