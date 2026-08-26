import { findSession } from '../../../shared/sessions'
import { requireSessionUser } from '../../utils/session'
import { progressKey, readProgress, uploadDir } from '../../utils/progress'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const sessionId = getQuery(event).sessionId
  if (typeof sessionId !== 'string' || !findSession(sessionId)) {
    throw createError({ statusCode: 422, statusMessage: 'Unknown session.' })
  }

  const storage = useStorage('data')
  const progress = await readProgress(user.email)
  const meta = progress.uploads[sessionId]
  if (!meta) {
    return { ok: true }
  }

  await storage.removeItem(`${uploadDir(user.email)}/${sessionId}/${meta.name}`)
  progress.uploads = Object.fromEntries(Object.entries(progress.uploads).filter(([id]) => id !== sessionId))
  await storage.setItem(progressKey(user.email), progress)

  return { ok: true }
})
