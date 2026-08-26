export function errorMessage(err: unknown): string {
  const data = (err as { data?: { statusMessage?: string } })?.data
  if (data?.statusMessage) {
    return data.statusMessage
  }
  if (err instanceof Error) {
    return err.message
  }
  return 'Something went wrong. Try again.'
}
