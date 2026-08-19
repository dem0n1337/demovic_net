import { expect, test } from '@playwright/test'
import { openBooted, STAGE } from '../helpers/boot'

// Deterministic screenshots: the mocked clock freezes time, `animations: 'disabled'`
// (set in playwright.config.ts) settles CSS animations, timezone/locale are pinned.
test.describe('visual regression', () => {
  test.beforeEach(async ({ page }) => {
    await openBooted(page)
  })

  test('BIOS POST fully enumerated', async ({ page }) => {
    await page.clock.runFor(9000)
    await expect(page.getByText('[NOT DETECTED]')).toBeVisible()
    await expect(page).toHaveScreenshot('bios-post.png')
  })

  test('GRUB stalled with all errors', async ({ page }) => {
    await page.clock.runFor(STAGE.POST + 8600)
    await expect(page.getByText('falling back to panic()')).toBeVisible()
    await expect(page).toHaveScreenshot('grub-stalled.png')
  })

  test('systemd cascade complete', async ({ page }) => {
    await page.clock.runFor(STAGE.POST + STAGE.GRUB + 9600)
    await expect(page.getByText('Generating "/run/initramfs/rdsosreport.txt"')).toBeVisible()
    await expect(page).toHaveScreenshot('systemd-cascade.png')
  })

  test('kernel panic screen', async ({ page }) => {
    await page.clock.runFor(STAGE.POST + STAGE.GRUB + STAGE.SYSD + STAGE.GLITCH + 300)
    await expect(page.getByText('*** KERNEL PANIC — NOT SYNCING ***')).toBeVisible()
    await expect(page).toHaveScreenshot('kernel-panic.png')
  })

  test('emergency shell resting state', async ({ page }) => {
    await page.clock.runFor(
      STAGE.POST + STAGE.GRUB + STAGE.SYSD + STAGE.GLITCH + STAGE.PANIC + 500,
    )
    await expect(page.getByText('Entering emergency mode')).toBeVisible()
    await expect(page).toHaveScreenshot('emergency-shell.png')
  })
})
