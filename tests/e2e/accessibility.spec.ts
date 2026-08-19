import { expect, test } from '@playwright/test'
import { openBooted, STAGE } from '../helpers/boot'

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test('glitch stage is skipped entirely — boot goes straight to kernel panic', async ({ page }) => {
    await openBooted(page)
    await page.clock.runFor(STAGE.POST + STAGE.GRUB + STAGE.SYSD + 300)
    await expect(page.getByText('*** KERNEL PANIC — NOT SYNCING ***')).toBeVisible()
    await expect(page.getByText('tux.service — PANIC (core dumped)')).not.toBeVisible()

    await page.clock.runFor(STAGE.PANIC)
    await expect(page.getByText('Entering emergency mode')).toBeVisible()
  })
})

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('emergency shell fits a phone screen without horizontal scroll', async ({ page }) => {
    await openBooted(page)
    await page.clock.runFor(
      STAGE.POST + STAGE.GRUB + STAGE.SYSD + STAGE.GLITCH + STAGE.PANIC + 500,
    )
    await expect(page.getByText('Entering emergency mode')).toBeVisible()
    await expect(page.getByText('auto-reboot in 45s')).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
