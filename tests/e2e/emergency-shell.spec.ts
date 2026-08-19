import { expect, test } from '@playwright/test'
import { enterShell, sh } from '../helpers/boot'

test.describe('emergency shell', () => {
  test.beforeEach(async ({ page }) => {
    await enterShell(page)
  })

  test('help prints the COMING SOON block and hints at hidden commands', async ({ page }) => {
    await sh(page, 'help')
    await expect(page.getByText('COMING SOON.', { exact: true })).toBeVisible()
    await expect(page.getByText('a portfolio is compiling on this domain')).toBeVisible()
    await expect(page.getByText('psst — this shell knows more commands than it admits')).toBeVisible()
  })

  test('unknown command suggests help', async ({ page }) => {
    await sh(page, 'frobnicate')
    await expect(page.getByText("command not found: frobnicate — try 'help'")).toBeVisible()
  })

  test('command echo uses the emergency prompt', async ({ page }) => {
    await sh(page, 'whoami')
    await expect(page.getByText('emergency@demovic.net:/# whoami')).toBeVisible()
    await expect(page.getByText("guest (until you run 'notify')")).toBeVisible()
  })

  test('journalctl explains what actually went wrong', async ({ page }) => {
    await sh(page, 'journalctl -xb')
    await expect(page.getByText('portfolio.mount: FAILED — reason: perfectionism')).toBeVisible()
    await expect(page.getByText('ship_it.service: condition check never passed')).toBeVisible()
  })

  test('systemctl status shows the not-built-yet unit', async ({ page }) => {
    await sh(page, 'systemctl status portfolio.mount')
    await expect(page.getByText('● portfolio.mount — /var/www/portfolio')).toBeVisible()
    await expect(page.getByText('vendor preset: procrastinate')).toBeVisible()
  })

  test('exit has no escape', async ({ page }) => {
    await sh(page, 'exit')
    await expect(page.getByText('Failed to start default.target: unit not found')).toBeVisible()
  })

  test('neofetch and cowsay easter eggs', async ({ page }) => {
    await sh(page, 'neofetch')
    await expect(page.getByText(/Kernel: 6\.1-panic-prone/)).toBeVisible()
    await sh(page, 'cowsay ship it')
    await expect(page.getByText(/< ship it >/)).toBeVisible()
  })

  test('sudo rm -rf / is a staged skit ending in a ZFS restore', async ({ page }) => {
    await sh(page, 'sudo rm -rf /')
    await expect(page.getByText('deleting /bin')).not.toBeVisible()
    await page.clock.runFor(500)
    await expect(page.getByText('deleting /bin … /etc … /home …')).toBeVisible()
    await page.clock.runFor(1000)
    await expect(page.getByText('wait.', { exact: true })).toBeVisible()
    await page.clock.runFor(800)
    await expect(page.getByText('restoring from ZFS snapshot… done. this is why we take snapshots.')).toBeVisible()
  })

  test('clear wipes the console', async ({ page }) => {
    await sh(page, 'help')
    await sh(page, 'clear')
    await expect(page.getByText('COMING SOON.', { exact: true })).not.toBeVisible()
    await expect(page.getByText('Entering emergency mode')).not.toBeVisible()
  })

  test('idle countdown ticks down and any keypress resets it to 45s', async ({ page }) => {
    await page.clock.runFor(30_000)
    await expect(page.getByText('auto-reboot in 15s')).toBeVisible()
    await page.keyboard.press('a')
    await expect(page.getByText('auto-reboot in 45s')).toBeVisible()
  })

  test('idle timeout reboots into the boot sequence again (attract loop)', async ({ page }) => {
    // the reload mid-runFor destroys the JS context — swallow that and assert the replay
    await page.clock.runFor(45_200).catch(() => {})
    await page.clock.runFor(1_000).catch(() => {})
    await expect(page.getByText('DEMOVIC BIOS (C) 2026 — v8.02')).toBeVisible()
  })

  test('notify queues the email via the API', async ({ page }) => {
    await page.route('**/api/notify', route => route.fulfill({ json: { ok: true } }))
    await sh(page, 'notify visitor@example.com')
    await expect(page.getByText('✓ visitor@example.com queued — one email at launch. ever.')).toBeVisible()
  })

  test('notify reports a grumpy queue when the API fails', async ({ page }) => {
    await page.route('**/api/notify', route => route.fulfill({ status: 500, json: { error: true } }))
    await sh(page, 'notify visitor@example.com')
    await expect(page.getByText('notify failed — the queue is grumpy')).toBeVisible()
  })

  test('notify without a valid email prints usage', async ({ page }) => {
    await sh(page, 'notify nope')
    await expect(page.getByText('usage: notify your@email.com')).toBeVisible()
  })
})
