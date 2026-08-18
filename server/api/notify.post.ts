import { appendFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import nodemailer from 'nodemailer'

// naive in-memory per-IP throttle; a single instance serves this site
const lastHit = new Map<string, number>()

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw createError({ statusCode: 400, statusMessage: 'invalid email' })
  }

  const ip
    = (getRequestHeader(event, 'x-forwarded-for') || '').split(',')[0]?.trim()
      || event.node.req.socket.remoteAddress
      || 'unknown'
  const now = Date.now()
  if (now - (lastHit.get(ip) ?? 0) < 10_000) {
    throw createError({ statusCode: 429, statusMessage: 'slow down' })
  }
  lastHit.set(ip, now)
  if (lastHit.size > 10_000) lastHit.clear()

  const cfg = useRuntimeConfig(event)
  let stored = false
  let mailed = false

  try {
    await mkdir(dirname(cfg.notifyStorePath), { recursive: true })
    await appendFile(
      cfg.notifyStorePath,
      JSON.stringify({ email, ip, at: new Date().toISOString() }) + '\n',
    )
    stored = true
  }
  catch (err) {
    console.error('notify: store failed', err)
  }

  if (cfg.smtpServer && cfg.smtpUser && cfg.smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: cfg.smtpServer,
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: cfg.smtpUser, pass: cfg.smtpPass },
      })
      await transporter.sendMail({
        from: `"demovic.net" <${cfg.smtpUser}>`,
        to: 'jakub@demovic.net',
        subject: `notify signup: ${email}`,
        text: `${email} queued for the launch notification (${new Date().toISOString()}, ip ${ip})`,
      })
      mailed = true
    }
    catch (err) {
      console.error('notify: mail failed', err)
    }
  }

  if (!stored && !mailed) {
    throw createError({ statusCode: 500, statusMessage: 'notify unavailable' })
  }
  return { ok: true }
})
