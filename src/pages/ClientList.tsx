import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, X, Bell, ChevronRight, LogOut, Settings } from 'lucide-react'
import { subscribeToClients, deleteClient } from '../storage/clientStorage'
import { useAuth } from '../contexts/AuthContext'
import { requestNotificationPermission, registerPushNotifications, checkAndNotify } from '../notifications/notificationService'
import type { Client } from '../types/client'
import { getStatus, statusColor, getDaysUntilExpiry } from '../types/client'

export default function ClientList() {
  const { user, logout } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<Client | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    let notified = false
    const unsub = subscribeToClients(user.uid, loaded => {
      setClients(loaded)
      if (!notified) {
        notified = true
        requestNotificationPermission().then(granted => {
          if (granted) {
            checkAndNotify(loaded)
            registerPushNotifications(user.uid)
          }
        })
      }
    })
    return unsub
  }, [user])

  const all = search
    ? clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phoneNumber.includes(search) ||
        c.subscriptionType.toLowerCase().includes(search.toLowerCase())
      )
    : clients

  const urgent   = all.filter(c => { const s = getStatus(c); return s === 'expiring_soon' || s === 'expired' })
  const active   = all.filter(c => getStatus(c) === 'active')
  const inactive = all.filter(c => getStatus(c) === 'inactive')

  const totalActive = clients.filter(c => getStatus(c) === 'active').length
  const totalSoon   = clients.filter(c => getStatus(c) === 'expiring_soon').length
  const totalExp    = clients.filter(c => getStatus(c) === 'expired').length

  const handleDelete = async (client: Client) => {
    if (!user) return
    await deleteClient(user.uid, client.id)
    setDeleteConfirm(null)
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F2ED]">
      {/* ── Header ── */}
      <div className="bg-[#FDFCFA] safe-top px-5 pt-4 pb-3 border-b border-[#EDE9E3]">
        <div className="flex items-center justify-between mb-3">
          <img src="/logo.png" alt="Deograce" className="h-14 object-contain mix-blend-multiply" />
          <div className="flex gap-2">
            <button className="relative w-11 h-11 rounded-full bg-[#EDE9E3] flex items-center justify-center active:bg-slate-200">
              <Bell className="w-4 h-4 text-slate-600" />
              {totalSoon > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full ring-2 ring-white" />}
            </button>
            <button
              onClick={() => setShowProfile(true)}
              className="w-11 h-11 rounded-full bg-[#EDE9E3] flex items-center justify-center active:bg-slate-200 overflow-hidden"
            >
              {user?.photoURL
                ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                : <span className="text-sm font-bold text-slate-600">{(user?.displayName ?? user?.email ?? 'U')[0].toUpperCase()}</span>}
            </button>
            <button
              onClick={() => navigate('/client/new')}
              className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center active:bg-blue-700 shadow-md shadow-blue-200"
            >
              <Plus className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client ou abonnement..."
            className="w-full pl-9 pr-8 py-2.5 bg-[#EDE9E3] rounded-xl text-sm text-slate-800 placeholder-slate-400 outline-none focus:bg-blue-50 focus:ring-2 focus:ring-blue-200 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28">
        {/* ── Stats row ── */}
        {!search && (
          <div className="px-4 pt-4 pb-2">
            <div className="bg-[#FDFCFA] rounded-2xl border border-[#EDE9E3] shadow-sm overflow-hidden">
              <div className="grid grid-cols-3 divide-x divide-slate-100">
                <StatCell value={totalActive} label="Actifs"   color="#16A34A" />
                <StatCell value={totalSoon}   label="Bientôt"  color="#EA580C" />
                <StatCell value={totalExp}    label="Expirés"  color="#DC2626" />
              </div>
            </div>
          </div>
        )}

        {/* ── Alert banner ── */}
        {!search && totalSoon > 0 && (
          <div className="mx-4 mt-3 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <span className="text-orange-500 text-base">⏰</span>
            </div>
            <p className="text-sm text-orange-700 font-medium flex-1">
              <span className="font-bold">{totalSoon} abonnement{totalSoon > 1 ? 's' : ''}</span> expire{totalSoon > 1 ? 'nt' : ''} bientôt
            </p>
          </div>
        )}

        {/* ── Empty state ── */}
        {all.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-8 animate-fade-in-up">
            <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center mb-5">
              <svg className="w-10 h-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-lg font-bold text-slate-800 text-center">
              {search ? 'Aucun résultat' : 'Aucun client'}
            </p>
            <p className="text-slate-400 text-sm text-center mt-1 leading-relaxed">
              {search ? "Essayez d'autres termes." : 'Ajoutez votre premier client pour commencer.'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/client/new')}
                className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-100 press"
              >
                Ajouter un client
              </button>
            )}
          </div>
        )}

        {urgent.length > 0 && (
          <Section label="À renouveler" count={urgent.length} color="#EA580C">
            {urgent.map((c, i) => (
              <ClientRow key={c.id} client={c} index={i}
                onClick={() => navigate(`/client/${c.id}`)}
                onDelete={() => setDeleteConfirm(c)} />
            ))}
          </Section>
        )}

        {active.length > 0 && (
          <Section label="Actifs" count={active.length} color="#16A34A">
            {active.map((c, i) => (
              <ClientRow key={c.id} client={c} index={i}
                onClick={() => navigate(`/client/${c.id}`)}
                onDelete={() => setDeleteConfirm(c)} />
            ))}
          </Section>
        )}

        {inactive.length > 0 && (
          <Section label="Inactifs" count={inactive.length} color="#94A3B8">
            {inactive.map((c, i) => (
              <ClientRow key={c.id} client={c} index={i}
                onClick={() => navigate(`/client/${c.id}`)}
                onDelete={() => setDeleteConfirm(c)} />
            ))}
          </Section>
        )}
      </div>

      {/* ── Profile sheet ── */}
      {showProfile && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={() => setShowProfile(false)} />
          <div className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto bg-[#FDFCFA] rounded-t-3xl z-50 px-6 pt-3 sheet-bottom animate-slide-up">
            <div className="w-8 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                {user?.photoURL
                  ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  : <span className="text-2xl font-black text-blue-500">{(user?.displayName ?? user?.email ?? 'U')[0].toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 truncate">{user?.displayName ?? 'Mon compte'}</p>
                <p className="text-sm text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setShowProfile(false); navigate('/account') }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#EDE9E3] text-slate-700 font-semibold text-sm press">
                <Settings className="w-4 h-4" />
                Modifier le profil
              </button>
              <button onClick={() => {
                  setShowProfile(false)
                  ;(window as unknown as { google?: { accounts?: { id?: { disableAutoSelect?: () => void } } } })
                    .google?.accounts?.id?.disableAutoSelect?.()
                  logout()
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 border border-red-100 text-red-600 font-semibold text-sm press">
                <LogOut className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Delete sheet ── */}
      {deleteConfirm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto bg-[#FDFCFA] rounded-t-3xl z-50 px-6 pt-3 sheet-bottom animate-slide-up">
            <div className="w-8 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
            <p className="text-base font-bold text-slate-900 text-center mb-1">Supprimer le client</p>
            <p className="text-sm text-slate-500 text-center mb-6">
              <span className="font-semibold text-slate-700">{deleteConfirm.name}</span> sera définitivement supprimé.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 rounded-2xl bg-[#EDE9E3] text-slate-700 font-semibold text-sm press">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-semibold text-sm press">
                Supprimer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatCell({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="py-4 text-center">
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</p>
    </div>
  )
}

function Section({ label, count, color, children }: { label: string; count: number; color: string; children: React.ReactNode }) {
  return (
    <div className="px-4 mt-5">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <span className="text-xs font-bold px-1.5 py-0.5 rounded-md bg-[#EDE9E3] text-slate-500">{count}</span>
      </div>
      <div className="bg-[#FDFCFA] rounded-2xl border border-[#EDE9E3] shadow-sm overflow-hidden divide-y divide-[#F0EDE8]">
        {children}
      </div>
    </div>
  )
}

function ClientRow({ client, index, onClick, onDelete }: {
  client: Client; index: number; onClick: () => void; onDelete: () => void
}) {
  const status = getStatus(client)
  const color  = statusColor(status)
  const days   = getDaysUntilExpiry(client)
  const initial = client.name.charAt(0).toUpperCase()

  const avatarColors: Record<string, string> = {
    active:        '#10B981',
    expiring_soon: '#F59E0B',
    expired:       '#EF4444',
    inactive:      '#94A3B8',
  }
  const avatarBg = avatarColors[status] + '22'
  const avatarFg = avatarColors[status]

  const dayLabel = days > 0 ? `${days}j` : days === 0 ? 'Auj.' : `−${Math.abs(days)}j`

  return (
    <button
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-[#F5F2ED] transition-colors animate-fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-base"
        style={{ backgroundColor: avatarBg, color: avatarFg }}>
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{client.name}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{client.subscriptionType}{client.phoneNumber ? ` · ${client.phoneNumber}` : ''}</p>
      </div>
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ color, backgroundColor: color + '18' }}>
          {dayLabel}
        </span>
        <ChevronRight className="w-4 h-4 text-slate-300" />
      </div>
    </button>
  )
}
