import { getToken, onMessage } from 'firebase/messaging'
import { getMessagingInstance } from '../firebase'
import { saveFcmToken } from '../storage/clientStorage'
import type { Client } from '../types/client'
import { getDaysUntilExpiry } from '../types/client'

const PUSH_SW_SCOPE = '/firebase-cloud-messaging-push-scope'

const NOTIF_KEY = 'deograce_notified'
const PRUNE_DAYS = 30

function getNotified(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}') } catch { return {} }
}

function pruneAndSave(n: Record<string, string>): Record<string, string> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - PRUNE_DAYS)
  const pruned = Object.fromEntries(
    Object.entries(n).filter(([, date]) => new Date(date) >= cutoff)
  )
  localStorage.setItem(NOTIF_KEY, JSON.stringify(pruned))
  return pruned
}

function markNotified(key: string, date: string) {
  const pruned = pruneAndSave(getNotified())
  pruned[key] = date
  localStorage.setItem(NOTIF_KEY, JSON.stringify(pruned))
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

// Enregistre le service worker FCM et envoie le token push au serveur,
// ce qui permet de recevoir des notifications même app fermée.
export async function registerPushNotifications(uid: string): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
  if (!vapidKey) return

  try {
    const messaging = await getMessagingInstance()
    if (!messaging) return

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: PUSH_SW_SCOPE,
    })

    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration })
    if (token) await saveFcmToken(uid, token)

    onMessage(messaging, payload => {
      const { title, body } = payload.notification ?? {}
      if (title && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon-192.png', tag: payload.data?.tag })
      }
    })
  } catch (e) {
    console.error('Erreur lors de l\'enregistrement des notifications push :', e)
  }
}

export function checkAndNotify(clients: Client[]) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const today = new Date().toISOString().split('T')[0]
  const notified = getNotified()

  clients.forEach(client => {
    if (!client.isActive) return
    const days = getDaysUntilExpiry(client)
    const notifKey = `${client.id}-${today}`
    if (notified[notifKey]) return

    if (days === 0) {
      new Notification("⚠️ Un abonnement expire aujourd'hui", {
        body: `Un abonnement arrive à échéance aujourd'hui. Ouvrez l'app pour renouveler.`,
        icon: '/icon-192.png',
        tag: notifKey
      })
      markNotified(notifKey, today)
    } else if (days > 0 && days <= 2) {
      new Notification(`⏰ Expiration dans ${days} jour${days > 1 ? 's' : ''}`, {
        body: `Un abonnement expire bientôt. Ouvrez l'app pour renouveler.`,
        icon: '/icon-192.png',
        tag: notifKey
      })
      markNotified(notifKey, today)
    } else if (days < 0 && Math.abs(days) % 3 === 0) {
      const elapsed = Math.abs(days)
      new Notification(`🔴 Abonnement non renouvelé — ${elapsed}j de retard`, {
        body: `Un abonnement n'a toujours pas été renouvelé. Ouvrez l'app pour agir.`,
        icon: '/icon-192.png',
        tag: notifKey
      })
      markNotified(notifKey, today)
    }
  })
}
