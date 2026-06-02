import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X, Users } from 'lucide-react'
import { getClients, deleteClient } from '../storage/clientStorage'
import type { Client } from '../types/client'
import { getStatus, statusLabel, statusColor, getDaysUntilExpiry } from '../types/client'

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setClients(getClients())
  }, [])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phoneNumber.includes(search) ||
    c.subscriptionType.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    active: clients.filter(c => getStatus(c) === 'active').length,
    soon: clients.filter(c => getStatus(c) === 'expiring_soon').length,
    expired: clients.filter(c => getStatus(c) === 'expired').length,
  }

  const handleDelete = (client: Client) => {
    deleteClient(client.id)
    setClients(getClients())
    setDeleteConfirm(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-blue-700 safe-top px-4 pb-4 pt-4 shadow-md">
        <h1 className="text-white text-xl font-bold">Mes Abonnements</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <StatCard label="Actifs" count={stats.active} color="#2E7D32" bg="#E8F5E9" />
          <StatCard label="Bientôt" count={stats.soon} color="#E65100" bg="#FFF3E0" />
          <StatCard label="Expirés" count={stats.expired} color="#B71C1C" bg="#FFEBEE" />
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client..."
            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        {/* List */}
        <div className="mt-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Users className="w-16 h-16 mb-3 opacity-40" />
              <p className="text-base">Aucun client</p>
              <p className="text-sm mt-1">Appuyez sur + pour en ajouter un</p>
            </div>
          ) : (
            filtered.map(client => (
              <ClientCard
                key={client.id}
                client={client}
                onClick={() => navigate(`/client/${client.id}`)}
                onDelete={() => setDeleteConfirm(client)}
              />
            ))
          )}
        </div>
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/client/new')}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-700 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Delete modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Supprimer le client</h3>
            <p className="text-gray-600 mt-2">Voulez-vous supprimer <strong>{deleteConfirm.name}</strong> ?</p>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, count, color, bg }: { label: string; count: number; color: string; bg: string }) {
  return (
    <div className="rounded-xl py-3 px-2 text-center" style={{ backgroundColor: bg }}>
      <p className="text-2xl font-bold" style={{ color }}>{count}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color }}>{label}</p>
    </div>
  )
}

function ClientCard({ client, onClick, onDelete }: { client: Client; onClick: () => void; onDelete: () => void }) {
  const status = getStatus(client)
  const color = statusColor(status)
  const label = statusLabel(status)
  const days = getDaysUntilExpiry(client)

  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-3 active:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 truncate">{client.name}</p>
        <p className="text-sm text-blue-700 truncate">{client.subscriptionType}</p>
        <p className="text-xs text-gray-400">{client.phoneNumber || 'Pas de numéro'}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded"
            style={{ color, backgroundColor: color + '22' }}
          >
            {label}
          </span>
          {days >= 0 && (
            <span className="text-xs text-gray-400">Expire dans {days}j</span>
          )}
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="p-2 text-red-400 active:text-red-600"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}
