import { isAdmin } from '../../utils/admins'
import { createSession } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const remember = Boolean(body?.remember)

  if (name.length < 2) {
    throw createError({ statusCode: 422, statusMessage: 'Please enter your name.' })
  }
  if (!isAdmin(email)) {
    throw createError({ statusCode: 403, statusMessage: 'Only admin accounts can sign in.' })
  }

  const user = { name, email }
  await createSession(event, user, remember)
  return { user }
})
