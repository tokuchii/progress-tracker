import { findSession, type Member } from '../../../shared/sessions'
import { requireSessionUser } from '../../utils/session'
import { readAssignments, withCompletion } from '../../utils/assignments'

export default defineEventHandler(async (event) => {
  await requireSessionUser(event)

  const body = await readBody(event)
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : ''
  const raw = Array.isArray(body?.members) ? body.members : []

  if (!findSession(sessionId)) {
    throw createError({ statusCode: 422, statusMessage: 'Unknown session.' })
  }

  const seen = new Set<string>()
  const members: Member[] = []
  for (const entry of raw) {
    if (typeof entry?.email !== 'string' || typeof entry?.name !== 'string') {
      continue
    }
    const email = entry.email.trim().toLowerCase()
    if (!email || seen.has(email)) {
      continue
    }
    seen.add(email)
    members.push({ email, name: entry.name })
  }

  const assignments = await readAssignments()
  assignments[sessionId] = members
  await useStorage('data').setItem('assignments', assignments)

  return { members: await withCompletion(sessionId, members) }
})
