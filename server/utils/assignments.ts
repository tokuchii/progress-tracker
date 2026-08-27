import { allSessions, type AssignedMember, type Member, type MemberStat } from '../../shared/sessions'

const usersKey = 'users'
const assignmentsKey = 'assignments'

export async function registerUser(member: Member) {
  const storage = useStorage('data')
  const users = await storage.getItem<Member[]>(usersKey) ?? []
  if (!users.some(user => user.email === member.email)) {
    users.push(member)
    await storage.setItem(usersKey, users)
  }
}

export async function listUsers(): Promise<Member[]> {
  const users = await useStorage('data').getItem<Member[]>(usersKey)
  return [...(users ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
}

export async function removeUsers(emails: string[]) {
  const storage = useStorage('data')
  const users = await storage.getItem<Member[]>(usersKey) ?? []
  const remaining = users.filter(user => !emails.includes(user.email))
  if (remaining.length !== users.length) {
    await storage.setItem(usersKey, remaining)
  }
}

export async function readAssignments(): Promise<Record<string, Member[]>> {
  const assignments = await useStorage('data').getItem<Record<string, Member[]>>(assignmentsKey)
  return assignments ?? {}
}

export async function withCompletion(sessionId: string, members: Member[]): Promise<AssignedMember[]> {
  return members.map(member => ({ ...member, completed: true }))
}

export async function memberStats(members: Member[]): Promise<MemberStat[]> {
  const assignments = await readAssignments()
  return members.map((member) => {
    const done = allSessions.filter(session => (assignments[session.id] ?? []).some(entry => entry.email === member.email)).length
    return {
      ...member,
      done,
      total: allSessions.length
    }
  })
}
