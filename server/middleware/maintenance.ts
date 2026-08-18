// coming-soon mode serves HTTP 200 (domain should get indexed);
// maintenance mode serves 503 + Retry-After while still rendering the page.
export default defineEventHandler((event) => {
  const mode = useRuntimeConfig(event).public.siteMode
  if (mode !== 'maintenance') return
  const path = event.path || '/'
  if (path.startsWith('/api/') || path.startsWith('/_nuxt/') || path.includes('.')) return
  setResponseStatus(event, 503, 'Service Unavailable')
  setResponseHeader(event, 'Retry-After', '3600')
})
