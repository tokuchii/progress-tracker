import { findSession } from '../../../shared/sessions'
import { requireSessionUser } from '../../utils/session'
import { setCompleted } from '../../utils/progress'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const body = await readBody(event)
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : ''

  if (!findSession(sessionId)) {
    throw createError({ statusCode: 422, statusMessage: 'Unknown session.' })
  }
  if (typeof body?.completed !== 'boolean') {
    throw createError({ statusCode: 422, statusMessage: 'Invalid request.' })
  }
  const completed = body.completed

  const progress = await setCompleted(user.email, sessionId, completed)
  return { completed: progress.completed }
})
