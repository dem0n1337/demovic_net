import { expect, test } from '@playwright/test'
import { openBooted, STAGE } from '../helpers/boot'

test.describe('boot sequence', () => {
  test.beforeEach(async ({ page }) => {
    await openBooted(page)
  })

  test('BIOS POST: memory odometer completes, devices detected one by one', async ({ page }) => {
    await expect(page.getByText('DEMOVIC BIOS (C) 2026 — v8.02')).toBeVisible()
    await expect(page.getByText('CPU : 1x Human Engineer @ 8+ yrs')).toBeVisible()

    // mid-count: OK not yet shown
    await page.clock.runFor(1000)
    await expect(page.getByText(/Memory Test :/)).not.toContainText('OK')

    // odometer done (128 × 20ms = 2.56s), devices follow every 1s
    await page.clock.runFor(2000)
    await expect(page.getByText(/Memory Test :/)).toContainText('65536')
    await expect(page.getByText(/Memory Test :/)).toContainText('OK')

    await page.clock.runFor(1100)
    await expect(page.getByText('hopes-and-dreams.img')).toBeVisible()

    await page.clock.runFor(5000)
    await expect(page.getByText('rubber-duck-debugger (senior)')).toBeVisible()
    await expect(page.getByText('cat-on-keyboard-detector')).toBeVisible()
    await expect(page.getByText('portfolio-ssd')).toBeVisible()
    await expect(page.getByText('[NOT DETECTED]')).toBeVisible()
  })

  test('GRUB: progress stalls at 43%, real GRUB errors burst in', async ({ page }) => {
    await page.clock.runFor(STAGE.POST)
    await expect(page.getByText('GRUB v2.12 — booting demovic.net')).toBeVisible()
    await expect(page.getByText('Loading kernel /vmlinuz-portfolio-1.0')).toBeVisible()

    // bar reaches 43% and STAYS there
    await page.clock.runFor(5000)
    await expect(page.getByText('43%')).toBeVisible()
    await page.clock.runFor(300)
    await expect(page.getByText('43%')).toBeVisible()

    await page.clock.runFor(3500)
    await expect(page.getByText('error: no such device: p0rtf0l10-c0m1ng-s00n.')).toBeVisible()
    await expect(page.getByText('error: you need to load the kernel first.')).toBeVisible()
    await expect(page.getByText('attempting fallback to /vmlinuz-excuses')).toBeVisible()
    await expect(page.getByText('falling back to panic()')).toBeVisible()
  })

  test('systemd/dracut cascade: OK burst, dracut warnings, FAILED and DEPEND', async ({ page }) => {
    await page.clock.runFor(STAGE.POST + STAGE.GRUB)

    // the [ OK ] burst lands within the first second
    await page.clock.runFor(1000)
    await expect(page.getByText('Started Journal Service.')).toBeVisible()
    await expect(page.getByText('Reached target Network is Online (it was dns).')).toBeVisible()
    await expect(page.getByText('Mounted /mnt/coffee (iv-drip, hot-pluggable).')).toBeVisible()

    // dracut warnings arrive later, FAILED not yet
    await expect(page.getByText('Failed to mount /var/www/portfolio.')).not.toBeVisible()
    await page.clock.runFor(2000)
    await expect(page.getByText(/dracut-initqueue\[504\]: Warning: dracut-initqueue timeout/)).toBeVisible()

    await page.clock.runFor(4000)
    await expect(page.getByText('Warning: Could not boot.')).toBeVisible()
    await expect(page.getByText('/dev/disk/by-uuid/p0rtf0l10-c0m1ng-s00n does not exist')).toBeVisible()
    await expect(page.getByText('Failed to mount /var/www/portfolio.')).toBeVisible()

    await page.clock.runFor(2000)
    await expect(page.getByText('Dependency failed for Local File Systems.')).toBeVisible()
    await expect(page.getByText('Dependency failed for Shipping It.')).toBeVisible()

    await page.clock.runFor(1800)
    await expect(page.getByText('Starting Dracut Emergency Shell')).toBeVisible()
    await expect(page.getByText('Generating "/run/initramfs/rdsosreport.txt"')).toBeVisible()
  })

  test('glitch burst: panicking Tux with core-dumped caption', async ({ page }) => {
    await page.clock.runFor(STAGE.POST + STAGE.GRUB + STAGE.SYSD + 300)
    await expect(page.getByAltText('Tux panicking')).toBeVisible()
    await expect(page.getByText('tux.service — PANIC (core dumped)')).toBeVisible()
  })

  test('kernel panic: banner, registers, call trace, countdown into recovery', async ({ page }) => {
    await page.clock.runFor(STAGE.POST + STAGE.GRUB + STAGE.SYSD + STAGE.GLITCH + 300)
    await expect(page.getByText('*** KERNEL PANIC — NOT SYNCING ***')).toBeVisible()
    await expect(page.getByText('RIP: 0010:deploy_portfolio+0x2026/0x2026')).toBeVisible()
    await expect(page.getByText('ship_it+0x0/0x1')).toBeVisible()
    await expect(page.getByText('PANIC: unable to mount /var/www/portfolio — not deployed yet')).toBeVisible()
    await expect(page.getByText(/rebooting into recovery mode in \d/)).toBeVisible()

    await page.clock.runFor(STAGE.PANIC)
    await expect(page.getByText('Entering emergency mode')).toBeVisible()
    await expect(page.getByText('auto-reboot in 45s')).toBeVisible()
  })
})
