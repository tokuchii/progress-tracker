import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import { isAdmin } from './admins'

const COOKIE = 'la_session'
const INACTIVITY_MS = 30 * 60 * 1000
const ACTIVITY_FLUSH_MS = 5 * 60 * 1000

export type Role = 'admin' | 'member'

export interface SessionUser {
  name: string
  email: string
  role: Role
}

export interface SessionRecord extends SessionUser {
  lastActiveAt: number
  remember: boolean
}

export async function getSessionUser(event: H3Event) {
  const token = getCookie(event, COOKIE)
  if (!token) {
    return null
  }
  const key = `sessions/${token}`
  const record = await useStorage('data').getItem<SessionRecord>(key)
  if (!record) {
    return null
  }
  const idle = Date.now() - record.lastActiveAt
  if (!record.remember && idle > INACTIVITY_MS) {
    await useStorage('data').removeItem(key)
    return null
  }
  if (idle > ACTIVITY_FLUSH_MS) {
    await useStorage('data').setItem(key, { ...record, lastActiveAt: Date.now() })
  }
  // Sessions created before roles existed were all admin sign-ins.
  const role = record.role ?? (isAdmin(record.email) ? 'admin' : 'member')
  return { name: record.name, email: record.email, role }
}

export async function requireSessionUser(event: H3Event) {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in to continue.' })
  }
  return user
}

export async function requireAdmin(event: H3Event) {
  const user = await requireSessionUser(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Only admins can do that.' })
  }
  return user
}

export async function createSession(event: H3Event, user: SessionUser, remember = false) {
  const token = randomUUID()
  await useStorage('data').setItem(`sessions/${token}`, { ...user, remember, lastActiveAt: Date.now() } satisfies SessionRecord)
  setCookie(event, COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    maxAge: remember ? 30 * 24 * 60 * 60 : undefined,
    path: '/'
  })
}

export async function destroySession(event: H3Event) {
  const token = getCookie(event, COOKIE)
  if (token) {
    await useStorage('data').removeItem(`sessions/${token}`)
  }
  deleteCookie(event, COOKIE, { path: '/' })
}
