import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'

const COOKIE = 'la_session'

export interface SessionUser {
  name: string
  email: string
}

export function getSessionUser(event: H3Event) {
  const token = getCookie(event, COOKIE)
  if (!token) {
    return null
  }
  return useStorage('data').getItem<SessionUser>(`sessions/${token}`)
}

export async function requireSessionUser(event: H3Event) {
  const user = await getSessionUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in to continue.' })
  }
  return user
}

export async function createSession(event: H3Event, user: SessionUser) {
  const token = randomUUID()
  await useStorage('data').setItem(`sessions/${token}`, user)
  setCookie(event, COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    maxAge: 7 * 24 * 60 * 60,
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
