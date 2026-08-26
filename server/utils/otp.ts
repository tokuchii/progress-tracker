import { createHash } from 'node:crypto'

export const OTP_TTL_MS = 5 * 60_000
export const OTP_RESEND_COOLDOWN_MS = 30_000
export const OTP_MAX_ATTEMPTS = 5

export interface OtpRecord {
  hash: string
  name: string
  expiresAt: number
  attempts: number
  lastSentAt: number
}

export function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex')
}
