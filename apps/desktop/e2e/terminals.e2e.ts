// Main paths of ConsolX: start, type in a shell, open a tab, split, close.
import { chooseInMenu, expect, groups, lines, tabs, terminals, test } from './consolx'

test('starts with one terminal running the default shell', async ({ consolx: { window } }) => {
  await expect(tabs(window)).toHaveCount(1)
  await expect(tabs(window)).toHaveAttribute('title', 'Command Prompt')
  await expect(lines(window).first()).toContainText('Microsoft Windows')
})

test('runs what is typed in the shell', async ({ consolx: { window } }) => {
  // Only the shell writes a line holding just the result: the line typed shows the
  // command, not 3333.
  await window.keyboard.type('set /a 1111*3')
  await window.keyboard.press('Enter')
  await expect(lines(window).filter({ hasText: /^3333\s*$/ })).toHaveCount(1)
})

test('opens a new tab from the + menu', async ({ consolx: { window } }) => {
  await chooseInMenu(window, 'Command Prompt')
  await expect(tabs(window)).toHaveCount(2)
  await expect(terminals(window)).toHaveCount(2)
})

test('splits the terminal to the right and down', async ({ consolx: { window } }) => {
  await chooseInMenu(window, 'Split right')
  await expect(groups(window)).toHaveCount(2)
  await chooseInMenu(window, 'Split down')
  await expect(groups(window)).toHaveCount(3)
  await expect(terminals(window)).toHaveCount(3)
})

test('closes a tab with its × button', async ({ consolx: { window } }) => {
  await chooseInMenu(window, 'Command Prompt')
  await expect(tabs(window)).toHaveCount(2)
  await window.getByRole('button', { name: 'Close Command Prompt' }).first().click()
  await expect(tabs(window)).toHaveCount(1)
  await expect(terminals(window)).toHaveCount(1)
})

test('closing the last tab closes the app', async ({ consolx: { app, window } }) => {
  const appClosed = app.waitForEvent('close')
  await window.getByRole('button', { name: 'Close Command Prompt' }).click()
  await appClosed
})
