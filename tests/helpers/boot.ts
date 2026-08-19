import { expect, type Page } from '@playwright/test'

// Stage durations mirror pages/index.vue — the single source of truth for pacing.
export const STAGE = {
  POST: 9600, // BIOS: memory odometer (+512/20ms) then devices every 1s
  GRUB: 9900, // bar to 43%, error bursts at 5300/5460/6900/8400
  SYSD: 10900, // per-line `at` timeline, dracut gaps match kernel timestamps
  GLITCH: 2200,
  PANIC: 6000, // countdown 6 × 1s
} as const

export const TO_SHELL
  = STAGE.POST + STAGE.GRUB + STAGE.SYSD + STAGE.GLITCH + STAGE.PANIC + 500

/** Install a deterministic clock; must run before page.goto(). */
export async function installBootClock(page: Page) {
  await page.clock.install({ time: new Date('2026-08-19T12:00:00') })
}

/** Load the page and fast-run the whole boot theatre into the emergency shell. */
export async function enterShell(page: Page) {
  await installBootClock(page)
  await page.goto('/')
  await page.clock.runFor(TO_SHELL)
  await expect(page.getByText('Entering emergency mode', { exact: false })).toBeVisible()
}

/** Type a command into the emergency shell and press Enter. */
export async function sh(page: Page, cmd: string) {
  const input = page.getByLabel('recovery console command input')
  await input.click()
  await input.fill(cmd)
  await input.press('Enter')
}
