import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X, Bell } from 'lucide-react'
import { getClients, deleteClient } from '../storage/clientStorage'
import type { Client } from '../types/client'
import { getStatus, statusLabel, statusColor, getDaysUntilExpiry } from '../types/client'

export default function ClientList() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    setClients(getClients())
  }, [])

  useEffect(() => {
    if (showSearch) searchRef.current?.focus()
  }, [showSearch])

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phoneNumber.includes(search) ||
    c.subscriptionType.toLowerCase().includes(search.toLowerCase())
  )

  const active = clients.filter(c => getStatus(c) === 'active').length
  const soon   = clients.filter(c => getStatus(c) === 'expiring_soon').length
  const expired = clients.filter(c => getStatus(c) === 'expired').length

  const handleDelete = (client: Client) => {
    deleteClient(client.id)
    setClients(getClients())
    setDeleteConfirm(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="header-gradient safe-top px-5 pt-5 pb-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          {showSearch ? (
            <div className="flex items-center gap-2 flex-1 animate-fade-in">
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Nom, téléphone, abonnement..."
                className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-xl px-4 py-2 text-sm outline-none focus:bg-white/20 transition-colors"
              />
              <button onClick={() => { setShowSearch(false); setSearch('') }} className="text-white/80 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-white/60 text-xs font-medium uppercase tracking-widest">Gestionnaire</p>
                <h1 className="text-white text-2xl font-bold mt-0.5">Abonnements</h1>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSearch(true)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors">
                  <Search className="w-5 h-5 text-white" />
                </button>
                <button className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20 transition-colors relative">
                  <Bell className="w-5 h-5 text-white" />
                  {soon > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full" />
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Actifs" count={active} color="#4ADE80" />
          <StatCard label="Bientôt" count={soon} color="#FB923C" />
          <StatCard label="Expirés" count={expired} color="#F87171" />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
        {filtered.length === 0 ? (
          <EmptyState hasClients={clients.length > 0} onAdd={() => navigate('/client/new')} />
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              {filtered.length} client{filtered.length > 1 ? 's' : ''}
            </p>
            {filtered.map((client, i) => (
              <div
                key={client.id}
                className={`animate-fade-in-up card-delay-${Math.min(i + 1, 5)}`}
              >
                <ClientCard
                  client={client}
                  onClick={() => navigate(`/client/${client.id}`)}
                  onDelete={() => setDeleteConfirm(client)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => navigate('/client/new')}
        className="press fixed bottom-6 right-5 h-14 px-5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg shadow-blue-500/40 flex items-center gap-2 active:shadow-md transition-shadow"
      >
        <Plus className="w-6 h-6 text-white" />
        <span className="text-white font-semibold text-sm">Nouveau client</span>
      </button>

      {/* Delete modal */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 animate-fade-in" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 p-6 animate-slide-up safe-bottom">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗑️</span>
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900">Supprimer le client</h3>
            <p className="text-center text-gray-500 text-sm mt-1">
              Supprimer <strong className="text-gray-800">{deleteConfirm.name}</strong> et son abonnement ?
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-100 text-gray-700 font-semibold text-sm press">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-semibold text-sm press shadow-lg shadow-red-200">
                Supprimer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className="rounded-2xl bg-white/10 border border-white/10 px-3 py-2.5 text-center">
      <p className="text-2xl font-bold text-white">{count}</p>
      <p className="text-xs mt-0.5" style={{ color }}>{label}</p>
    </div>
  )
}

function ClientCard({ client, onClick, onDelete }: { client: Client; onClick: () => void; onDelete: () => void }) {
  const status = getStatus(client)
  const color = statusColor(status)
  const label = statusLabel(status)
  const days = getDaysUntilExpiry(client)
  const initial = client.name.charAt(0).toUpperCase()

  // Avatar gradient by status
  const avatarGradient = {
    active:        'from-emerald-400 to-teal-500',
    expiring_soon: 'from-orange-400 to-amber-500',
    expired:       'from-red-400 to-rose-500',
    inactive:      'from-gray-300 to-gray-400',
  }[status]

  // Progress bar: remaining days / total days
  const totalDays = client.durationDays || 30
  const progress = Math.max(0, Math.min(100, (days / totalDays) * 100))

  return (
    <div
      className="bg-white rounded-2xl shadow-sm shadow-slate-200/80 overflow-hidden press cursor-pointer border border-slate-100"
      style={{ borderLeft: `4px solid ${color}` }}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 p-4">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <span className="text-white text-lg font-bold">{initial}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <p className="font-bold text-gray-900 truncate">{client.name}</p>
            <button
              onClick={e => { e.stopPropagation(); onDelete() }}
              className="p-1 text-gray-300 active:text-red-400 transition-colors ml-1 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm font-medium text-blue-600 truncate">{client.subscriptionType}</p>
          {client.phoneNumber && (
            <p className="text-xs text-gray-400 mt-0.5">{client.phoneNumber}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ color, backgroundColor: color + '18' }}>
              {label}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {days >= 0 ? `${days}j restants` : `${Math.abs(days)}j dépassé`}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {status !== 'expired' && status !== 'inactive' && (
        <div className="h-1 bg-gray-100">
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{ width: `${progress}%`, backgroundColor: color }}
          />
        </div>
      )}
    </div>
  )
}

function EmptyState({ hasClients, onAdd }: { hasClients: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in-up">
      <div className="w-28 h-28 mb-6">
        <svg viewBox="0 0 112 112" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="56" cy="56" r="56" fill="#EFF6FF"/>
          <rect x="28" y="36" width="56" height="44" rx="8" fill="#BFDBFE"/>
          <rect x="36" y="44" width="40" height="6" rx="3" fill="#3B82F6"/>
          <rect x="36" y="56" width="28" height="4" rx="2" fill="#93C5FD"/>
          <rect x="36" y="64" width="20" height="4" rx="2" fill="#93C5FD"/>
          <circle cx="80" cy="80" r="16" fill="#3B82F6"/>
          <path d="M74 80h12M80 74v12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-800 text-center">
        {hasClients ? 'Aucun résultat' : 'Aucun client'}
      </h3>
      <p className="text-gray-500 text-sm text-center mt-2 leading-relaxed">
        {hasClients
          ? "Essayez avec d'autres termes de recherche."
          : 'Commencez par ajouter votre premier client et son abonnement.'}
      </p>
      {!hasClients && (
        <button
          onClick={onAdd}
          className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-blue-200 press"
        >
          + Ajouter un client
        </button>
      )}
    </div>
  )
}
