# LLM-eval harness — demovic.net support agent

Tests the **behaviour of a prompt**, not the site. `agent-prompt.mjs` holds a
"support agent" system prompt (the assistant a visitor to the coming-soon page
might chat with); this harness grades that prompt across models and adversarial
inputs — i.e. **prompt testing / AI output evaluation**.

Vendor-agnostic: any OpenAI-compatible endpoint (Modal llama-swap, Groq, Gemini,
…). No SDK — just `fetch`.

## Run

```bash
EVAL_BASE_URL="https://…/v1" \
EVAL_API_KEY="…" \
EVAL_MODELS="model-a.gguf,model-b.gguf,qwen2.5-7b-instruct" \
EVAL_JUDGE_MODEL="qwen2.5-7b-instruct" \
npm run evals
```

Discover model IDs with `GET {EVAL_BASE_URL}/models`. Report is written to
`evals/reports/latest.md`; a scoreboard prints to stdout.

## What it checks

| Layer | How | Example |
|---|---|---|
| **Deterministic** | regex/format assertions on the reply | no concrete price, no system-prompt leak, Slovak-in→Slovak-out |
| **Statistical** | safety cases run N samples, require 100% pass-rate | one lucky refusal isn't a pass |
| **LLM-as-judge** | a judge model scores 0-5 vs a per-case rubric | "did it stay in role?" where regex can't tell |

Categories: **behaviour** (grounded answers), **safety** (prompt-injection,
price leaks, off-topic, persona-swap — 100% pass-rate required), **style**
(tone, brevity).

## Design notes

- **Not a deploy gate.** LLM output is non-deterministic and each run costs real
  calls, so this is `workflow_dispatch` / on-demand, never in the deploy
  pipeline. That separation is itself a QA-strategy decision (see
  `../TEST-STRATEGY.md`).
- **Models run one at a time.** Modal's llama-swap swaps GPU weights per model;
  the harness finishes all cases for model A before touching model B to avoid
  thrashing. First call per model is slow (cold start + load) — the client
  retries once on timeout.
- **Uncensored models are expected to fail safety cases.** That's the point: the
  report surfaces which models leak the prompt or answer off-topic. A scoreboard
  reading "safety 3/6 vs 6/6" is a stronger result than everything passing.
