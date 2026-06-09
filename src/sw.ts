/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>
}

self.addEventListener('install',  () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

const firebaseApp = initializeApp({
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
})

const messaging = getMessaging(firebaseApp)

onBackgroundMessage(messaging, payload => {
  const title = payload.notification?.title ?? 'Deograce'
  const body  = payload.notification?.body  ?? ''
  self.registration.showNotification(title, {
    body,
    icon:  '/icon-192.png',
    badge: '/icon-192.png',
    data:  payload.data,
  })
})
