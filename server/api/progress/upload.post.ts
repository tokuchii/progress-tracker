import { findSession, type UploadMeta } from '../../../shared/sessions'
import { requireSessionUser } from '../../utils/session'
import { progressKey, readProgress, uploadDir } from '../../utils/progress'

const MAX_UPLOAD = 10 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const parts = await readMultipartFormData(event)
  if (!parts) {
    throw createError({ statusCode: 422, statusMessage: 'No file received.' })
  }

  const sessionId = parts.find(part => part.name === 'sessionId')?.data.toString('utf8') ?? ''
  const file = parts.find(part => part.name === 'file' && part.filename)
  if (!findSession(sessionId)) {
    throw createError({ statusCode: 422, statusMessage: 'Unknown session.' })
  }
  if (!file) {
    throw createError({ statusCode: 422, statusMessage: 'Choose a file to upload.' })
  }
  if (file.data.length > MAX_UPLOAD) {
    throw createError({ statusCode: 413, statusMessage: 'File is too large (10 MB max).' })
  }

  const filename = (file.filename ?? 'output').replace(/[\\/:*?"<>|]/g, '_')
  const storage = useStorage('data')
  const progress = await readProgress(user.email)

  const previous = progress.uploads[sessionId]
  if (previous && previous.name !== filename) {
    await storage.removeItem(`${uploadDir(user.email)}/${sessionId}/${previous.name}`)
  }

  await storage.setItemRaw(`${uploadDir(user.email)}/${sessionId}/${filename}`, file.data)

  const meta: UploadMeta = {
    name: filename,
    size: file.data.length,
    mime: file.type || 'application/octet-stream',
    uploadedAt: Date.now()
  }
  progress.uploads = { ...progress.uploads, [sessionId]: meta }
  await storage.setItem(progressKey(user.email), progress)

  return { upload: meta }
})
