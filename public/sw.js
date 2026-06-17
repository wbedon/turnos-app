// Service Worker — maneja push notifications y notificationclick

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}

  const title   = data.title ?? 'Sistema de Turnos'
  const options = {
    body:             data.body ?? '',
    icon:             '/icons/icon-192.png',
    badge:            '/icons/icon-192.png',
    tag:              data.tag ?? 'turno',       // colapsa notifs del mismo turno
    renotify:         true,
    requireInteraction: true,
    data:             { url: data.url ?? '/' },
    actions: [
      { action: 'open', title: '📍 Ver mi turno' },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Si ya hay una pestaña abierta con esa URL, la enfoca
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus()
          }
        }
        // Si no, abre una nueva
        return clients.openWindow(url)
      })
  )
})
