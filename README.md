# demovic.net

Coming-soon / maintenance page for **demovic.net** — a theatrical "failed boot → kernel panic → recovery console" experience. Nuxt 4, terminal aesthetic, JetBrains Mono.

## Behavior

- Auto-playing boot sequence (~15s): BIOS POST → GRUB (stalls at 43%) → systemd/dracut failure cascade → glitch burst (skipped under `prefers-reduced-motion`) → kernel panic → interactive emergency shell.
- Emergency shell: `notify <email>` (real endpoint: `POST /api/notify` — stores to `/data/notify-signups.jsonl` + optional SMTP mail), `journalctl -xb`, `systemctl reboot|default|status`, `status`, `clear` + a pile of hidden easter eggs (`neofetch`, `cowsay`, `sudo rm -rf /`, `hack`, `tux`, …).
- 45s idle → auto-reboot (attract loop). Console text is server-rendered for SEO; theatrics run as a client overlay.
- `SITE_MODE=coming-soon` (default) serves HTTP 200; `SITE_MODE=maintenance` serves 503 + `Retry-After` and swaps the panic copy.

## Console commands & easter eggs

Public (listed by `help`):

| Command | Reaction |
|---|---|
| `help` | Big glowing `COMING SOON.` block + command list |
| `notify <email>` | Real signup — stores to `/data/notify-signups.jsonl` + mails Jakub via SMTP |
| `journalctl` / `journalctl -xb` | Fake boot log: `portfolio.mount: FAILED — reason: perfectionism`, `ship_it.service: condition check never passed`, … |
| `status` / `uptime` | Live fake rebuild % (`rebuild 98.7% · everything else operational`) |
| `systemctl reboot` / `reboot` / `retry` | `rebooting…` → full page reload, replays the whole boot |
| `clear` | Wipes the console |

Hidden:

| Command | Reaction |
|---|---|
| `systemctl default` / `exit` / `logout` / `quit` | `Failed to start default.target: unit not found — that's literally why you're here.` |
| `systemctl status <anything>` | Red failed-unit status: `Loaded: not-built-yet (disabled; vendor preset: procrastinate)` |
| `sudo rm -rf /` | Staged skit: deleting… → `wait.` → `restoring from ZFS snapshot… done.` |
| `sudo <anything>` | `guest is not in the sudoers file. this incident will be reported (to jakub).` |
| `rm` / `dd` / `chmod` / `mkfs` | `career-ending move detected. blocked by policy (and common sense).` |
| `neofetch` | ASCII Tux + system card (kernel `6.1-panic-prone`, Memory 640K) |
| `htop` / `top` | Process table: `final_polish_loop` 99.7 % CPU, `ship_it <defunct>` |
| `cowsay [msg]` | The cow says your message (default `COMING SOON.`) |
| `sl` | ASCII train — `you meant ls. the train has left anyway.` |
| `ls` | `.procrastination  .perfectionism  portfolio.tar.gz.part  TODO.md` |
| `whoami` | `guest (until you run 'notify')` |
| `vim` / `vi` / `nano` / `emacs` | Trapped-in-vim joke, auto-rescue |
| `fortune` | Random sysadmin one-liner (`it's always DNS.`, …) |
| `hack` / `nmap` | Staged "exploit" ending `ACCESS DENIED — fail2ban says hi.` |
| `coffee` / `brew` | `HTTP 418 — i'm a teapot.` |
| `date` | Real date + `still not launch day.` |
| `uname` | `demovic.net 0.9.0-rc1 #1 SMP PREEMPT_PANIC x86_64 GNU/Linux` |
| `man [x]` | `no manual entry… task failed successfully.` |
| `ping [host]` | `everything is reachable except the thing you came for.` |
| `tux` | Flashes the panicking Tux overlay for 1.6 s |

Idle 45 s (or `reboot`) → auto-reboot, the whole sequence replays.

## Development

```bash
npm install
npm run dev
```

## Testing

Playwright suite (`npm run build && npm test`) — 33 tests, ~20s, zero sleeps:

- **E2E boot sequence** — every stage asserted (BIOS odometer, GRUB 43% stall, systemd/dracut bursts, glitch, panic, shell) using Playwright's **mocked clock** (`page.clock.runFor`), so the ~40s theatre runs in milliseconds and can't flake on timing.
- **Emergency shell** — commands, easter eggs, staged skits, idle reset, attract-loop reload; `notify` against a mocked API (success + failure paths).
- **API** — `POST /api/notify`: 400 validation, 200 + store persistence, 429 rate limit.
- **Accessibility** — `prefers-reduced-motion` skips the glitch stage; mobile viewport has no horizontal overflow.
- **Visual regression** — per-stage screenshots with animations disabled and a pinned clock/timezone.
- **SSR/SEO** — console text server-rendered without JS, meta/canonical, maintenance mode 503 + `Retry-After`.

CI runs the suite as a **quality gate**: `test` → image build+push → deploy → **post-deploy smoke** against https://demovic.net (200, SSR content, www→apex 301). Playwright HTML report is uploaded as a workflow artifact.

## Deployment

Mirrors kvp-servis-modern: push to `master` → GitHub Actions builds the Docker image, pushes to GHCR, then SSH-deploys to the server (`~/demovic_net`, container bound to `127.0.0.1:3001`, nginx reverse-proxies `demovic.net`), purges Cloudflare cache and pings IndexNow.

Env (via `.env` on the server): `SITE_MODE`, `SMTP_SERVER`, `SMTP_USER`, `SMTP_PASS`.

Design reference lives in `design_handoff/` (git-ignored, local only).
