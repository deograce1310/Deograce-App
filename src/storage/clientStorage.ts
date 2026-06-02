import { collection, doc, setDoc, deleteDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { Client } from '../types/client'

const col = (uid: string) => collection(db, 'users', uid, 'clients')
const ref = (uid: string, id: string) => doc(db, 'users', uid, 'clients', id)

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export async function saveClient(uid: string, client: Client): Promise<void> {
  await setDoc(ref(uid, client.id), client)
}

export async function deleteClient(uid: string, id: string): Promise<void> {
  await deleteDoc(ref(uid, id))
}

export async function getClient(uid: string, id: string): Promise<Client | null> {
  const snap = await getDoc(ref(uid, id))
  return snap.exists() ? (snap.data() as Client) : null
}

export function subscribeToClients(uid: string, onChange: (clients: Client[]) => void): () => void {
  return onSnapshot(col(uid), snap => {
    onChange(snap.docs.map(d => d.data() as Client))
  })
}
