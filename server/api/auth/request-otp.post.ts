import { generateCode, hashCode, OTP_RESEND_COOLDOWN_MS, OTP_TTL_MS, type OtpRecord } from '../../utils/otp'
import { sendOtpEmail } from '../../utils/mail'

const LEADSAGRI_EMAIL = /^[^\s@]+@leadsagri\.com$/i

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (name.length < 2) {
    throw createError({ statusCode: 422, statusMessage: 'Please enter your name.' })
  }
  if (!LEADSAGRI_EMAIL.test(email)) {
    throw createError({ statusCode: 422, statusMessage: 'Please use your @leadsagri.com email address.' })
  }

  const storage = useStorage('data')
  const key = `otp/${email}`
  const existing = await storage.getItem<OtpRecord>(key)
  if (existing && Date.now() - existing.lastSentAt < OTP_RESEND_COOLDOWN_MS) {
    throw createError({ statusCode: 429, statusMessage: 'A code was just sent. Wait a few seconds before requesting a new one.' })
  }

  const code = generateCode()
  await storage.setItem(key, {
    hash: hashCode(code),
    name,
    expiresAt: Date.now() + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: Date.now()
  } satisfies OtpRecord)

  const config = useRuntimeConfig(event)
  if (config.smtp.host) {
    await sendOtpEmail(event, email, name, code)
  } else {
    console.info(`[otp] ${email}: ${code}`)
  }

  return {
    ok: true,
    devCode: import.meta.dev && !config.smtp.host ? code : undefined
  }
})
