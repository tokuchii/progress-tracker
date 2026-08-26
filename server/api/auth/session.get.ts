import { getSessionUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  return { user: await getSessionUser(event) }
})
