import { findSession } from '../../../shared/sessions'
import { requireSessionUser } from '../../utils/session'
import { readProgress, uploadDir } from '../../utils/progress'

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
    throw createError({ statusCode: 404, statusMessage: 'No file uploaded for this session.' })
  }

  const data = await storage.getItemRaw<Buffer>(`${uploadDir(user.email)}/${sessionId}/${meta.name}`)
  if (!data) {
    throw createError({ statusCode: 404, statusMessage: 'File not found.' })
  }

  setHeader(event, 'Content-Type', meta.mime)
  setHeader(event, 'Content-Disposition', `attachment; filename="${meta.name}"`)
  return data
})
