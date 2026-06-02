export interface Client {
  id: string
  name: string
  phoneNumber: string
  subscriptionType: string
  startDate: string
  durationDays: number
  expirationDate: string
  price: number
  notes: string
  isActive: boolean
  createdAt: string
}

export type SubscriptionStatus = 'active' | 'expiring_soon' | 'expired' | 'inactive'

export function getStatus(client: Client): SubscriptionStatus {
  if (!client.isActive) return 'inactive'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(client.expirationDate)
  if (isNaN(expiry.getTime())) return 'inactive'
  expiry.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 2) return 'expiring_soon'
  return 'active'
}

export function getDaysUntilExpiry(client: Client): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(client.expirationDate)
  if (isNaN(expiry.getTime())) return 0
  expiry.setHours(0, 0, 0, 0)
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function statusLabel(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':        return 'Actif'
    case 'expiring_soon': return 'Expire bientôt'
    case 'expired':       return 'Expiré'
    case 'inactive':      return 'Inactif'
  }
}

export function statusColor(status: SubscriptionStatus): string {
  switch (status) {
    case 'active':        return '#2E7D32'
    case 'expiring_soon': return '#E65100'
    case 'expired':       return '#B71C1C'
    case 'inactive':      return '#757575'
  }
}
