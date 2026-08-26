import { hashCode, OTP_MAX_ATTEMPTS, type OtpRecord } from '../../utils/otp'
import { createSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const code = typeof body?.code === 'string' ? body.code.trim() : ''

  if (!email || code.length !== 6) {
    throw createError({ statusCode: 422, statusMessage: 'Enter the 6-digit code from your email.' })
  }

  const storage = useStorage('data')
  const key = `otp/${email}`
  const record = await storage.getItem<OtpRecord>(key)
  if (!record) {
    throw createError({ statusCode: 400, statusMessage: 'No code was requested for this email. Start again.' })
  }

  if (Date.now() > record.expiresAt) {
    await storage.removeItem(key)
    throw createError({ statusCode: 400, statusMessage: 'That code has expired. Request a new one.' })
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    await storage.removeItem(key)
    throw createError({ statusCode: 429, statusMessage: 'Too many wrong attempts. Request a new code.' })
  }

  if (hashCode(code) !== record.hash) {
    await storage.setItem(key, { ...record, attempts: record.attempts + 1 })
    throw createError({ statusCode: 400, statusMessage: 'Incorrect code. Check your email and try again.' })
  }

  await storage.removeItem(key)
  const user = { name: record.name, email }
  await createSession(event, user)
  return { user }
})
