export type NotificationColor = 'error' | 'success' | 'info'

export interface AppNotification {
  id: number
  title: string
  message?: string
  color: NotificationColor
}

const notifications = ref<AppNotification[]>([])
let nextId = 0

export function useNotify() {
  function dismiss(id: number) {
    notifications.value = notifications.value.filter(notification => notification.id !== id)
  }

  function notify(input: { title: string, message?: string, color?: NotificationColor }) {
    const id = ++nextId
    notifications.value.push({ id, title: input.title, message: input.message, color: input.color ?? 'info' })
    setTimeout(() => dismiss(id), 3500)
  }

  return { notifications, notify, dismiss }
}
