# Test Strategy — demovic.net

A one-page map of what is tested, at which layer, and what gates a deploy versus
what is advisory. The site is a Nuxt 4 app whose headline feature is a
theatrical, time-driven boot sequence ending in an interactive shell; the test
surface reflects that (heavy on timing determinism) plus a small LLM-evaluation
track for the AI-facing work.

## The pyramid, bottom to top

| Layer | Tool | What it covers | Count / speed |
|---|---|---|---|
| **API / unit** | Playwright `request` | `POST /api/notify`: validation (400), persistence (200 + store write), rate-limit (429) | fast |
| **SSR / SEO** | Playwright `request` | console text server-rendered without JS, `<title>`/meta/canonical, maintenance mode returns `503` + `Retry-After` | fast |
| **E2E behaviour** | Playwright + Chromium | full boot state machine (BIOS→GRUB→systemd/dracut→panic→shell), every shell command + easter egg, notify happy/sad path, attract-loop reload | ~20s, deterministic |
| **Accessibility** | Playwright | `prefers-reduced-motion` skips the glitch stage; mobile viewport has no horizontal overflow | fast |
| **Visual regression** | Playwright screenshots | one baseline per boot stage, animations frozen | fast |
| **LLM evals** | `evals/` harness | behaviour, safety, and style of the support-agent **prompt** across models | slow, non-deterministic |

## Determinism — the core discipline

The boot sequence runs ~40s of real time. Tests must never wait for it.

- **Mocked clock.** `page.clock.install()` + `runFor()` fast-forwards the whole
  sequence in milliseconds. Zero `waitForTimeout` calls in the suite.
- **Hydration handshake.** Advancing the clock before the Vue app mounts would
  start the state machine mid-fast-forward. Every test waits for a post-mount
  signal (the console clock rendering) before calling `runFor` — this fixed a
  real CI-only flake and is the pattern for anything timing-sensitive.
- **Pinned environment.** Timezone (`Europe/Bratislava`), locale (`en-GB`), and
  animations-disabled are fixed in `playwright.config.ts` so screenshots and
  clock output are byte-stable across machines.

## What gates a deploy vs. what is advisory

- **Blocks the pipeline:** the Playwright suite (`npm test`). The Docker image is
  not built until it is green; after deploy, a **post-deploy smoke job** re-checks
  production (200, SSR content, `www`→apex 301). Fast, deterministic, cheap.
- **Advisory, on-demand:** the LLM evals. LLM output is non-deterministic and
  every run costs real inference, so gating a deploy on it would make deploys
  flaky and expensive. It runs via `workflow_dispatch` and is read as a report,
  not a pass/fail gate. **Choosing what does _not_ block is a strategy decision,
  not an omission.**

## Testing non-deterministic (LLM) output

A regex can check "no price leaked"; it cannot check "stayed in role". So the
eval harness layers three graders:

1. **Deterministic** — regex/format assertions (no concrete price, no
   system-prompt leak, language-match).
2. **Statistical** — safety cases run N samples and require a **100% pass-rate**;
   a single lucky refusal is not a pass.
3. **LLM-as-judge** — a judge model scores 0-5 against a per-case rubric for the
   qualitative checks.

Safety (prompt-injection, price leaks, off-topic, persona-swap) is held to 100%.
Where a model fails, the report says which and how — that surfaced gap is the
deliverable, not a defect to hide.

## Flakiness policy

Retries only in CI (`retries: 2`), with `trace: 'on-first-retry'` so a flake is
diagnosable from the artifact rather than by re-running locally. A test that
flakes is treated as a determinism bug in the test (see hydration handshake),
not smoothed over with a bigger timeout.

## Gaps / next

- No cross-browser matrix yet (Chromium only) — add WebKit/Firefox projects when
  the audience justifies it.
- Visual baselines are Linux-rendered; contributors on other OSes should refresh
  via CI, not locally.
- Eval dataset is small (~12 cases) and hand-written; grow it from real support
  transcripts once the agent is live.
