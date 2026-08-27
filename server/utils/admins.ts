export const ADMIN_EMAILS = [
  'kmacabos@leadsagri.com',
  'marcelus@leadsagri.com',
  'arnan@leadsagri.com',
  'rtaleon@leadsagri.com'
]

export function isAdmin(email: string) {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase())
}
