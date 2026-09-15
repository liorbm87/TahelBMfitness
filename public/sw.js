self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || 'https://res.cloudinary.com/mryir3yi/image/upload/v1788171304/s6wzpzoxwxycolyfcu04.png',
      badge: 'https://res.cloudinary.com/mryir3yi/image/upload/v1788171304/s6wzpzoxwxycolyfcu04.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
      },
      requireInteraction: true // משאיר את ההתראה עד שהמשתמש לוחץ או סוגר
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then( windowClients => {
      // אם האפליקציה כבר פתוחה באחד הטאבים, התמקד בה
      for (var i = 0; i < windowClients.length; i++) {
        var client = windowClients[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // אחרת פתח חלון חדש
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});