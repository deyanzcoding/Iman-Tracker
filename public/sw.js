// Service Worker for "Iman Tracker" PWA Push & Schedule Notifications
const CACHE_NAME = 'iman-tracker-v1';

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push Event Listener (For Remote Server Push Notifications)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Iman Tracker', body: event.data.text() };
    }
  }

  const title = data.title || '📿 Iman Tracker Reminder';
  const targetUrl = data.url || '/namaz';

  const options = {
    body: data.body || 'Time for your Islamic spiritual reminder.',
    icon: data.icon || '/favicon_192_x_192.png',
    badge: data.badge || '/favicon_32_x_32.png',
    vibrate: [200, 100, 200],
    tag: data.tag || `iman-reminder-${Date.now()}`,
    requireInteraction: true,
    data: {
      url: targetUrl,
      tab: data.tab || 'namaz'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Event Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // If user clicked 'close' action button
  if (event.action === 'close') {
    return;
  }

  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/';
  const targetTab = notificationData.tab || (targetUrl.includes('dua') ? 'dua' : targetUrl.includes('quran') ? 'quran' : 'namaz');

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If an existing window/tab is open, focus it and post a message
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'OPEN_ISLAMIC_TAB',
            tab: targetTab,
            url: targetUrl
          });
          return;
        }
      }

      // 2. If no window is open, open a new window
      if (self.clients.openWindow) {
        const fullUrl = new URL(targetUrl.startsWith('/') ? `#${targetTab}` : targetUrl, self.location.origin).href;
        return self.clients.openWindow(fullUrl);
      }
    })
  );
});
