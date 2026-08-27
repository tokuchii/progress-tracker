export interface ProgressRecord {
  completed: string[]
}

export function progressKey(email: string) {
  return `progress/${email}`
}

export async function readProgress(email: string): Promise<ProgressRecord> {
  const record = await useStorage('data').getItem<ProgressRecord>(progressKey(email))
  return record ?? { completed: [] }
}

const writeQueues = new Map<string, Promise<ProgressRecord>>()

export async function setCompleted(email: string, sessionId: string, completed: boolean): Promise<ProgressRecord> {
  const run = async (): Promise<ProgressRecord> => {
    const progress = await readProgress(email)
    const set = new Set(progress.completed)
    if (completed) {
      set.add(sessionId)
    } else {
      set.delete(sessionId)
    }
    progress.completed = [...set]
    await useStorage('data').setItem(progressKey(email), progress)
    return progress
  }
  const previous = writeQueues.get(email) ?? Promise.resolve()
  const next = previous.then(run, run)
  writeQueues.set(email, next)
  return next
}
