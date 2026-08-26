import { findSession } from '../../../shared/sessions'
import { requireSessionUser } from '../../utils/session'
import { progressKey, readProgress } from '../../utils/progress'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const body = await readBody(event)
  const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : ''
  const completed = Boolean(body?.completed)

  if (!findSession(sessionId)) {
    throw createError({ statusCode: 422, statusMessage: 'Unknown session.' })
  }

  const progress = await readProgress(user.email)
  const set = new Set(progress.completed)
  if (completed) {
    set.add(sessionId)
  } else {
    set.delete(sessionId)
  }
  progress.completed = [...set]
  await useStorage('data').setItem(progressKey(user.email), progress)

  return { completed: progress.completed }
})
