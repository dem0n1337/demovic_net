# demovic.net

Coming-soon / maintenance page for **demovic.net** — a theatrical "failed boot → kernel panic → recovery console" experience. Nuxt 4, terminal aesthetic, JetBrains Mono.

## Behavior

- Auto-playing boot sequence (~12s): BIOS POST → GRUB (stalls at 43%) → glitch burst (skipped under `prefers-reduced-motion`) → kernel panic → interactive recovery console.
- Recovery console: `notify <email>` (real endpoint: `POST /api/notify` — stores to `/data/notify-signups.jsonl` + optional SMTP mail), `status`, `reboot`, `clear` + a pile of hidden easter eggs (`neofetch`, `cowsay`, `sudo rm -rf /`, `hack`, `tux`, …).
- 45s idle → auto-reboot (attract loop). Console text is server-rendered for SEO; theatrics run as a client overlay.
- `SITE_MODE=coming-soon` (default) serves HTTP 200; `SITE_MODE=maintenance` serves 503 + `Retry-After` and swaps the panic copy.

## Development

```bash
npm install
npm run dev
```

## Deployment

Mirrors kvp-servis-modern: push to `master` → GitHub Actions builds the Docker image, pushes to GHCR, then SSH-deploys to the server (`~/demovic_net`, container bound to `127.0.0.1:3001`, nginx reverse-proxies `demovic.net`), purges Cloudflare cache and pings IndexNow.

Env (via `.env` on the server): `SITE_MODE`, `SMTP_SERVER`, `SMTP_USER`, `SMTP_PASS`.

Design reference lives in `design_handoff/` (git-ignored, local only).
