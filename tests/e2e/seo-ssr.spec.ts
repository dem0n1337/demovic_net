import { expect, test } from '@playwright/test'
import { MAINTENANCE_PORT } from '../../playwright.config'

test.describe('SSR & SEO (no JavaScript required)', () => {
  test('coming-soon mode serves HTTP 200 with the console text server-rendered', async ({ request }) => {
    const res = await request.get('/')
    expect(res.status()).toBe(200)
    const html = await res.text()
    expect(html).toContain('<title>demovic.net — coming soon</title>')
    expect(html).toContain('demovic.net is compiling')
    expect(html).toContain('Entering emergency mode')
    expect(html).toContain('emergency shell (dracut)')
    expect(html).toContain('DEMOVIC BIOS (C) 2026')
    expect(html).toContain('lang="en"')
    expect(html).toContain('rel="canonical"')
  })

  test('static assets are served', async ({ request }) => {
    for (const path of ['/favicon.svg', '/robots.txt', '/tux-panic-green.png']) {
      const res = await request.get(path)
      expect(res.status(), path).toBe(200)
    }
  })

  test('maintenance mode serves 503 + Retry-After while still rendering the page', async ({ request }) => {
    const res = await request.get(`http://127.0.0.1:${MAINTENANCE_PORT}/`)
    expect(res.status()).toBe(503)
    expect(res.headers()['retry-after']).toBe('3600')
    expect(await res.text()).toContain('emergency shell (dracut)')
  })

  test('maintenance mode swaps the panic copy for the client', async ({ request }) => {
    const html = await (await request.get(`http://127.0.0.1:${MAINTENANCE_PORT}/`)).text()
    expect(html).toContain('maintenance')
  })
})
