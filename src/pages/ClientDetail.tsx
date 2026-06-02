import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit3, RefreshCw, Phone, Calendar, Clock, DollarSign, FileText } from 'lucide-react'
import { getClient, saveClient } from '../storage/clientStorage'
import type { Client } from '../types/client'
import { getStatus, statusLabel, statusColor, getDaysUntilExpiry } from '../types/client'

const RENEW_PRESETS = [
  { label: '1 mois', days: 30 },
  { label: '3 mois', days: 90 },
  { label: '6 mois', days: 180 },
  { label: '1 an', days: 365 },
]

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [showRenew, setShowRenew] = useState(false)
  const [renewDays, setRenewDays] = useState('30')

  useEffect(() => { if (id) setClient(getClient(id) || null) }, [id])

  if (!client) return (
    <div className="flex items-center justify-center h-full bg-[#F5F2ED]">
      <div className="w-7 h-7 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const status = getStatus(client)
  const color  = statusColor(status)
  const days   = getDaysUntilExpiry(client)
  const progress = Math.max(0, Math.min(100, (days / (client.durationDays || 30)) * 100))

  const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const avatarColors: Record<string, string> = {
    active: '#10B981', expiring_soon: '#F59E0B', expired: '#EF4444', inactive: '#94A3B8'
  }
  const avatarColor = avatarColors[status]

  const handleRenew = () => {
    const d = parseInt(renewDays) || 30
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + d)
    const updated: Client = {
      ...client,
      startDate: new Date().toISOString().split('T')[0],
      durationDays: d,
      expirationDate: expiry.toISOString().split('T')[0],
      isActive: true
    }
    saveClient(updated)
    setClient(updated)
    setShowRenew(false)
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F2ED]">
      {/* Header */}
      <div className="bg-[#FDFCFA] safe-top px-4 pt-4 pb-4 border-b border-[#EDE9E3] flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full bg-[#EDE9E3] flex items-center justify-center press flex-shrink-0">
          <ArrowLeft className="w-4 h-4 text-slate-700" />
        </button>
        <p className="flex-1 text-base font-bold text-slate-900 truncate">{client.name}</p>
        <button onClick={() => navigate(`/client/${id}/edit`)} className="w-11 h-11 rounded-full bg-[#EDE9E3] flex items-center justify-center press flex-shrink-0">
          <Edit3 className="w-4 h-4 text-slate-700" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 animate-fade-in-up">
        {/* Hero card */}
        <div className="bg-[#FDFCFA] mx-4 mt-4 rounded-2xl border border-[#EDE9E3] shadow-sm p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0"
              style={{ backgroundColor: avatarColor + '18', color: avatarColor }}>
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-lg font-black text-slate-900 truncate">{client.name}</p>
              <p className="text-sm font-semibold text-blue-500">{client.subscriptionType}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg" style={{ color, backgroundColor: color + '18' }}>
                  {statusLabel(status)}
                </span>
                {client.price > 0 && (
                  <span className="text-xs text-slate-400 font-medium">{client.price} €/mois</span>
                )}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 font-medium mb-1.5">
              <span>{fmt(client.startDate)}</span>
              <span className="font-bold" style={{ color }}>
                {days >= 0 ? `${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''}` : `Expiré il y a ${Math.abs(days)}j`}
              </span>
            </div>
            <div className="h-2 bg-[#EDE9E3] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, backgroundColor: color }} />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1 text-right">{fmt(client.expirationDate)}</p>
          </div>
        </div>

        {/* Details */}
        <div className="bg-[#FDFCFA] mx-4 mt-3 rounded-2xl border border-[#EDE9E3] shadow-sm overflow-hidden">
          {client.phoneNumber && <DetailRow icon={Phone} label="Téléphone" value={client.phoneNumber} />}
          <DetailRow icon={Calendar} label="Date de début" value={fmt(client.startDate)} />
          <DetailRow icon={Calendar} label="Expiration" value={fmt(client.expirationDate)} />
          <DetailRow icon={Clock} label="Durée" value={`${client.durationDays} jours`} />
          {client.price > 0 && <DetailRow icon={DollarSign} label="Prix mensuel" value={`${client.price} €`} />}
          {client.notes && <DetailRow icon={FileText} label="Notes" value={client.notes} last />}
        </div>

        {/* Renew button */}
        <div className="mx-4 mt-3">
          <button onClick={() => setShowRenew(true)}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 press shadow-lg shadow-blue-100 active:bg-blue-700">
            <RefreshCw className="w-4 h-4" />
            Renouveler l'abonnement
          </button>
        </div>
      </div>

      {/* Renew sheet */}
      {showRenew && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={() => setShowRenew(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#FDFCFA] rounded-t-3xl z-50 px-6 pt-3 pb-8 safe-bottom animate-slide-up">
            <div className="w-8 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <p className="text-base font-bold text-slate-900 mb-1">Renouveler l'abonnement</p>
            <p className="text-sm text-slate-400 mb-5">{client.name} — {client.subscriptionType}</p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {RENEW_PRESETS.map(({ label, days: presetDays }) => (
                <button key={presetDays} onClick={() => setRenewDays(String(presetDays))}
                  className={`py-3 rounded-xl text-xs font-bold transition-all press ${
                    parseInt(renewDays) === presetDays
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                      : 'bg-[#EDE9E3] text-slate-600'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Durée personnalisée</label>
            <div className="flex items-center bg-[#EDE9E3] rounded-xl px-4 py-3 mb-5">
              <input type="number" value={renewDays} onChange={e => setRenewDays(e.target.value)}
                className="flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none" />
              <span className="text-xs text-slate-400 font-medium">jours</span>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowRenew(false)} className="flex-1 py-3.5 rounded-2xl bg-[#EDE9E3] text-slate-700 font-semibold text-sm press">
                Annuler
              </button>
              <button onClick={handleRenew} className="flex-1 py-3.5 rounded-2xl bg-blue-600 text-white font-bold text-sm press">
                Confirmer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function DetailRow({ icon: Icon, label, value, last }: {
  icon: React.ElementType; label: string; value: string; last?: boolean
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${!last ? 'border-b border-[#F0EDE8]' : ''}`}>
      <div className="w-7 h-7 rounded-lg bg-[#EDE9E3] flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <p className="text-sm text-slate-500 w-28 flex-shrink-0">{label}</p>
      <p className="text-sm font-semibold text-slate-900 flex-1 text-right">{value}</p>
    </div>
  )
}
