self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'GJ 06', {
      body: data.body || 'New notification',
      icon: '/images/GJ 06 logo.png',
      badge: '/images/GJ 06 logo.png',
      tag: data.tag || 'gj06',
      requireInteraction: true,
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/kitchen.html'));
});
