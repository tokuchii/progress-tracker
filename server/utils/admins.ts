export const ADMIN_EMAILS = [
  'marcelus@blueframeph.com',
  'kmacabos@leadsagri.com',
  'aaraza@leadsagri.com'
]

export function isAdmin(email: string) {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase())
}
