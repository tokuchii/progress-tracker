import { findSession } from '../../../shared/sessions'
import { requireSessionUser } from '../../utils/session'
import { setCompleted } from '../../utils/progress'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const body = await readBody(event)
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : ''
  const completed = Boolean(body?.completed)

  if (!findSession(sessionId)) {
    throw createError({ statusCode: 422, statusMessage: 'Unknown session.' })
  }

  const progress = await setCompleted(user.email, sessionId, completed)
  return { completed: progress.completed }
})
