import { allSessions, type AssignedMember, type Member, type MemberStat } from '../../shared/sessions'

const usersKey = 'users'
const assignmentsKey = 'assignments'

export async function registerUser(member: Member) {
  const storage = useStorage('data')
  const users = await storage.getItem<Member[]>(usersKey) ?? []
  const email = member.email.trim().toLowerCase()
  const existing = users.find(user => user.email === email)
  if (!existing) {
    users.push({ name: member.name, email })
    await storage.setItem(usersKey, users)
    return
  }
  if (existing.name !== member.name) {
    existing.name = member.name
    await storage.setItem(usersKey, users)
  }
}

export async function syncAssignmentNames() {
  const storage = useStorage('data')
  const users = await storage.getItem<Member[]>(usersKey) ?? []
  const byEmail = new Map(users.map(user => [user.email, user.name]))
  const assignments = await storage.getItem<Record<string, Member[]>>(assignmentsKey) ?? {}
  let changed = false
  for (const members of Object.values(assignments)) {
    for (const member of members) {
      const name = byEmail.get(member.email)
      if (name && member.name !== name) {
        member.name = name
        changed = true
      }
    }
  }
  if (changed) {
    await storage.setItem(assignmentsKey, assignments)
  }
}

export async function listUsers(): Promise<Member[]> {
  const users = await useStorage('data').getItem<Member[]>(usersKey)
  return [...(users ?? [])].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
}

export async function findUser(email: string): Promise<Member | undefined> {
  const users = await useStorage('data').getItem<Member[]>(usersKey)
  return (users ?? []).find(user => user.email === email)
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
