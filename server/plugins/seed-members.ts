import type { Member } from '../../shared/sessions'
import { registerUser, removeUsers } from '../utils/assignments'
import { ADMIN_EMAILS } from '../utils/admins'

// Team members tracked in the bootcamp. Admin login accounts are not members.
const DEFAULT_MEMBERS: Member[] = [
  { name: 'Adriane', email: 'adriane@blueframeph.com' },
  { name: 'Ivan', email: 'irubiales@leadsagri.com' },
  { name: 'Jhon', email: 'jacampos@leadsagri.com' },
  { name: 'Joshua', email: 'joshua@blueframeph.com' }
]

export default defineNitroPlugin(async () => {
  await removeUsers(ADMIN_EMAILS)
  for (const member of DEFAULT_MEMBERS) {
    await registerUser(member)
  }
})
