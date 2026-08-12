/**
 * Helper to register Service Worker and handle notification click message routing
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined') return;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW Registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('SW Registration error:', error);
        });
    });

    // Listen for messages dispatched from Service Worker notification clicks
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'OPEN_ISLAMIC_TAB') {
        const tab = event.data.tab;
        if (tab && typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('open_islamic_tab', { detail: { tab } })
          );
        }
      }
    });
  }
}
