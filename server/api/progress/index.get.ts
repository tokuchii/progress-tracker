import { requireSessionUser } from '../../utils/session'
import { readProgress } from '../../utils/progress'

export default defineEventHandler(async (event) => {
  const user = await requireSessionUser(event)
  const progress = await readProgress(user.email)
  return { user, ...progress }
})
