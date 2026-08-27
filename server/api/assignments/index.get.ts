import { allSessions, type AssignedMember } from '../../../shared/sessions'
import { requireSessionUser } from '../../utils/session'
import { listUsers, memberStats, readAssignments, withCompletion } from '../../utils/assignments'

export default defineEventHandler(async (event) => {
  await requireSessionUser(event)

  const assignments = await readAssignments()
  const bySession: Record<string, AssignedMember[]> = {}
  for (const session of allSessions) {
    const list = assignments[session.id]
    if (list?.length) {
      bySession[session.id] = await withCompletion(session.id, list)
    }
  }

  const members = await listUsers()

  return { bySession, members, stats: await memberStats(members) }
})
