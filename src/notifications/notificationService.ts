import type { Client } from '../types/client'
import { getDaysUntilExpiry } from '../types/client'

const NOTIF_KEY = 'deograce_notified'

function getNotified(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(NOTIF_KEY) || '{}') } catch { return {} }
}

function markNotified(key: string, date: string) {
  const n = getNotified()
  n[key] = date
  localStorage.setItem(NOTIF_KEY, JSON.stringify(n))
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
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
      // Jour J : expiration aujourd'hui
      new Notification("⚠️ Abonnement expiré aujourd'hui", {
        body: `L'abonnement ${client.subscriptionType} de ${client.name} expire aujourd'hui !`,
        icon: '/icon-192.png',
        tag: notifKey
      })
      markNotified(notifKey, today)

    } else if (days > 0 && days <= 2) {
      // 1 ou 2 jours avant
      new Notification(`⏰ Expiration dans ${days} jour${days > 1 ? 's' : ''}`, {
        body: `${client.name} — ${client.subscriptionType} expire dans ${days} jour${days > 1 ? 's' : ''}.`,
        icon: '/icon-192.png',
        tag: notifKey
      })
      markNotified(notifKey, today)

    } else if (days < 0 && Math.abs(days) % 3 === 0) {
      // Toutes les 3 jours après expiration tant que non renouvelé
      const elapsed = Math.abs(days)
      new Notification(`🔴 Abonnement non renouvelé — ${elapsed}j de retard`, {
        body: `${client.name} — ${client.subscriptionType} n'a toujours pas été renouvelé.`,
        icon: '/icon-192.png',
        tag: notifKey
      })
      markNotified(notifKey, today)
    }
  })
}
