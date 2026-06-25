import { useEffect } from 'react'
import { createRealtimeClient } from '../lib/realtime'

export function useRealtimeNotifications({
  enabled = true,
  type,
  id,
  token,
  includeStaffBroadcast = false,
  onNotification,
}) {
  useEffect(() => {
    if (!enabled || !type || !token || (type !== 'staff' && !id)) {
      return undefined
    }

    let echo = null
    const channels = []
    let cancelled = false

    const connectTimer = window.setTimeout(() => {
      if (cancelled) return

      echo = createRealtimeClient(token)

      if (!echo) {
        return
      }

      const listen = (channelName) => {
        channels.push(channelName)
        echo.private(channelName).listen('.notification.created', (event) => {
          onNotification?.(event.notification || event)
        })
      }

      if (type === 'customer') {
        listen(`customer.notifications.${id}`)
      }

      if (type === 'staff') {
        if (id) {
          listen(`staff.notifications.${id}`)
        }

        if (includeStaffBroadcast) {
          listen('staff.notifications')
        }
      }
    }, 150)

    return () => {
      cancelled = true
      window.clearTimeout(connectTimer)

      if (echo) {
        channels.forEach((channelName) => echo.leave(channelName))
        echo.disconnect()
      }
    }
  }, [enabled, id, includeStaffBroadcast, onNotification, token, type])
}
