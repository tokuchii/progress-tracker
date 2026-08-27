export default defineNitroPlugin(() => {
  if (import.meta.dev) {
    return
  }
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return
  }
  console.warn('[storage] KV_REST_API_URL / KV_REST_API_TOKEN are not set — data will use the local filesystem, which is read-only on Vercel. Sign-in, progress and notes will fail with 500s. Connect Vercel KV or set the env vars.')
})
