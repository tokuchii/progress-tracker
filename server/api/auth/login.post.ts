import { isAdmin } from '../../utils/admins'
import { findUser } from '../../utils/assignments'
import { createSession, type SessionUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  const remember = Boolean(body?.remember)

  if (name.length < 2) {
    throw createError({ statusCode: 422, statusMessage: 'Please enter your name.' })
  }
  const role = isAdmin(email) ? 'admin' : await findUser(email) ? 'member' : null
  if (!role) {
    throw createError({ statusCode: 403, statusMessage: 'Only team members can sign in.' })
  }

  const user: SessionUser = { name, email, role }
  await createSession(event, user, remember)
  return { user }
})
