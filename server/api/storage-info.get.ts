export default defineEventHandler(() => {
  const mount = useStorage().getMount('data')
  return { driver: mount?.driver?.name ?? 'unknown' }
})
