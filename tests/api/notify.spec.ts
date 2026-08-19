import { readFile } from 'node:fs/promises'
import { expect, test } from '@playwright/test'

// Order matters (the endpoint rate-limits per IP for 10s) — run this file serially.
test.describe.configure({ mode: 'serial' })

const STORE = 'test-results/notify-store.jsonl'

test.describe('POST /api/notify', () => {
  test('rejects an invalid email with 400 (before consuming the rate limit)', async ({ request }) => {
    const res = await request.post('/api/notify', { data: { email: 'not-an-email' } })
    expect(res.status()).toBe(400)
  })

  test('rejects garbage bodies with 400', async ({ request }) => {
    const res = await request.post('/api/notify', {
      headers: { 'content-type': 'application/json' },
      data: '{{{not json',
    })
    expect(res.status()).toBe(400)
  })

  test('accepts a valid email, persists it, and throttles an immediate retry with 429', async ({ request }) => {
    const email = `qa-suite-${Date.now()}@example.com`

    // first request may land inside a previous attempt's 10s window (CI retries) — poll until accepted
    let accepted
    await expect(async () => {
      accepted = await request.post('/api/notify', { data: { email } })
      expect(accepted.status()).toBe(200)
    }).toPass({ intervals: [2_000], timeout: 20_000 })
    expect(await accepted!.json()).toEqual({ ok: true })

    const store = await readFile(STORE, 'utf8')
    const lines = store.trim().split('\n').map(l => JSON.parse(l))
    expect(lines.some(l => l.email === email)).toBe(true)

    // immediate second signup from the same IP hits the throttle
    const throttled = await request.post('/api/notify', { data: { email: 'second@example.com' } })
    expect(throttled.status()).toBe(429)
  })
})
