import type { UploadMeta } from '../../shared/sessions'

export interface ProgressRecord {
  completed: string[]
  uploads: Record<string, UploadMeta>
}

export function progressKey(email: string) {
  return `progress/${email}`
}

export function uploadDir(email: string) {
  return `uploads/${email.replace(/[^a-z0-9]/gi, '_')}`
}

export async function readProgress(email: string): Promise<ProgressRecord> {
  const record = await useStorage('data').getItem<ProgressRecord>(progressKey(email))
  return record ?? { completed: [], uploads: {} }
}
