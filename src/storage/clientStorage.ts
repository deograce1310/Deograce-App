import type { Client } from '../types/client'

const KEY = 'deograce_clients'

export function getClients(): Client[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
}

export function saveClient(client: Client): void {
  const clients = getClients()
  const idx = clients.findIndex(c => c.id === client.id)
  if (idx >= 0) clients[idx] = client
  else clients.push(client)
  localStorage.setItem(KEY, JSON.stringify(clients))
}

export function deleteClient(id: string): void {
  const clients = getClients().filter(c => c.id !== id)
  localStorage.setItem(KEY, JSON.stringify(clients))
}

export function getClient(id: string): Client | undefined {
  return getClients().find(c => c.id === id)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
