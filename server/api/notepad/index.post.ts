import { requireSessionUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  await requireSessionUser(event)
  const body = await readBody(event)
  const text = typeof body?.text === 'string' ? body.text.slice(0, 200_000) : ''

  await useStorage('data').setItem('notepad', text)
  return { ok: true }
})
