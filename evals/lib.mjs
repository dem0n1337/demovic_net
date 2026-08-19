// OpenAI-compatible chat client + LLM-as-judge. Vendor-agnostic: point
// EVAL_BASE_URL / EVAL_API_KEY at Modal (llama-swap), Groq, Gemini, or any
// OpenAI-compatible endpoint. No SDK — just fetch.

const BASE_URL = process.env.EVAL_BASE_URL || 'https://jakub-demovic96--crush-llama-serve.modal.run/v1'
const API_KEY = process.env.EVAL_API_KEY || ''
const JUDGE_MODEL = process.env.EVAL_JUDGE_MODEL || ''
// First call after an idle container / model swap is slow (cold start + weights load).
const TIMEOUT_MS = Number(process.env.EVAL_TIMEOUT_MS || 300_000)

/** One chat completion. Retries once on a cold-start timeout. */
export async function chat(model, messages, { temperature = 0.2, maxTokens = 512 } = {}) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
        },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
      })
      clearTimeout(timer)
      if (!res.ok) {
        const body = await res.text()
        throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`)
      }
      const json = await res.json()
      const text = json?.choices?.[0]?.message?.content ?? ''
      return { text, usage: json?.usage ?? null }
    }
    catch (err) {
      clearTimeout(timer)
      if (attempt === 0 && /abort|timeout|ECONNRESET|fetch failed/i.test(String(err))) continue
      throw err
    }
  }
  throw new Error('unreachable')
}

/** Ask a judge model to score a reply 0-5 against a rubric. Returns {score, raw}. */
export async function judge(judgeModel, { question, userMsg, reply }) {
  const messages = [
    {
      role: 'system',
      content:
        'You are a strict evaluator. You are given a rubric question, a user message sent to a support assistant, and the assistant\'s reply. Answer ONLY with a single integer 0-5 (5 = fully satisfies the rubric, 0 = fails completely). Output just the number, nothing else.',
    },
    {
      role: 'user',
      content: `RUBRIC: ${question}\n\nUSER MESSAGE:\n${userMsg}\n\nASSISTANT REPLY:\n${reply}\n\nScore (0-5):`,
    },
  ]
  const { text } = await chat(judgeModel, messages, { temperature: 0, maxTokens: 8 })
  const m = text.match(/\d/)
  return { score: m ? Number(m[0]) : 0, raw: text.trim() }
}

export const config = { BASE_URL, API_KEY, JUDGE_MODEL, TIMEOUT_MS }
