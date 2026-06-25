import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

const apiBase = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '')

function envValue(key, fallback = '') {
  return import.meta.env[key] || fallback
}

export function createRealtimeClient(token) {
  const realtimeEnabled = String(envValue('VITE_REVERB_ENABLED', 'false')).toLowerCase() === 'true'
  const appKey = envValue('VITE_REVERB_APP_KEY')

  if (!realtimeEnabled || !appKey || !token) {
    return null
  }

  window.Pusher = Pusher

  const scheme = envValue('VITE_REVERB_SCHEME', 'http')
  const port = Number(envValue('VITE_REVERB_PORT', scheme === 'https' ? 443 : 8080))
  const forceTLS = scheme === 'https'

  return new Echo({
    broadcaster: 'reverb',
    key: appKey,
    wsHost: envValue('VITE_REVERB_HOST', window.location.hostname),
    wsPort: port,
    wssPort: port,
    forceTLS,
    enabledTransports: forceTLS ? ['wss'] : ['ws'],
    authEndpoint: `${apiBase}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  })
}
