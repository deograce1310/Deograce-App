import type { Client } from '../types/client'
import { getDaysUntilExpiry } from '../types/client'

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
      new Notification("⚠️ Abonnement expiré aujourd'hui", {
        body: `L'abonnement ${client.subscriptionType} de ${client.name} expire aujourd'hui !`,
        icon: '/icon-192.png',
        tag: notifKey
      })
      markNotified(notifKey, today)
    } else if (days > 0 && days <= 2) {
      new Notification(`⏰ Expiration dans ${days} jour${days > 1 ? 's' : ''}`, {
        body: `${client.name} — ${client.subscriptionType} expire dans ${days} jour${days > 1 ? 's' : ''}.`,
        icon: '/icon-192.png',
        tag: notifKey
      })
      markNotified(notifKey, today)
    } else if (days < 0 && Math.abs(days) % 3 === 0) {
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
