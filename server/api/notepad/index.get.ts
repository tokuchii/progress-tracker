import { requireSessionUser } from '../../utils/session'

export default defineEventHandler(async (event) => {
  await requireSessionUser(event)
  const text = await useStorage('data').getItem<string>('notepad')
  return { text: text ?? '' }
})
