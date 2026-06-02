import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit3, RefreshCw, Phone, Calendar, Clock, DollarSign, FileText } from 'lucide-react'
import { getClient, saveClient } from '../storage/clientStorage'
import type { Client } from '../types/client'
import { getStatus, statusLabel, statusColor, getDaysUntilExpiry } from '../types/client'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState<Client | null>(null)
  const [showRenew, setShowRenew] = useState(false)
  const [renewDays, setRenewDays] = useState('30')

  useEffect(() => {
    if (id) setClient(getClient(id) || null)
  }, [id])

  if (!client) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const status = getStatus(client)
  const color = statusColor(status)
  const days = getDaysUntilExpiry(client)
  const progress = Math.max(0, Math.min(100, (days / (client.durationDays || 30)) * 100))

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })

  const avatarGradient = {
    active:        'from-emerald-400 to-teal-500',
    expiring_soon: 'from-orange-400 to-amber-500',
    expired:       'from-red-400 to-rose-500',
    inactive:      'from-gray-300 to-gray-400',
  }[status]

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

  const RENEW_PRESETS = [{ label: '1 mois', days: 30 }, { label: '3 mois', days: 90 }, { label: '6 mois', days: 180 }, { label: '1 an', days: 365 }]

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header blanc */}
      <div className="bg-white safe-top px-5 pt-4 pb-4 shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center press">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <img src="/logo.png" alt="Deograce" className="w-10 h-10 object-contain" />
          <button onClick={() => navigate(`/client/${id}/edit`)} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center press">
            <Edit3 className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Profil client */}
      <div className="px-5 pt-5 pb-5 flex items-center gap-4 bg-white border-b border-gray-100 animate-fade-in-up">
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center shadow-md flex-shrink-0`}>
          <span className="text-white text-2xl font-bold">{client.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-gray-900 text-xl font-extrabold truncate">{client.name}</h1>
          <p className="text-blue-500 text-sm font-semibold">{client.subscriptionType}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ color, backgroundColor: color + '22' }}>
              {statusLabel(status)}
            </span>
            {client.price > 0 && (
              <span className="text-xs text-gray-400 font-medium">{client.price} €/mois</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-4">
        {/* Progress card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4 animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-700">Progression de l'abonnement</p>
            <span className="text-sm font-bold" style={{ color }}>
              {days >= 0 ? `${days}j restants` : `Expiré il y a ${Math.abs(days)}j`}
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progress}%`, backgroundColor: color }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-400">{formatDate(client.startDate)}</span>
            <span className="text-xs text-gray-400">{formatDate(client.expirationDate)}</span>
          </div>
        </div>

        {/* Details card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {client.phoneNumber && <DetailRow icon={<Phone className="w-4 h-4" />} label="Téléphone" value={client.phoneNumber} color="#3B82F6" />}
          <DetailRow icon={<Calendar className="w-4 h-4" />} label="Date de début" value={formatDate(client.startDate)} color="#8B5CF6" />
          <DetailRow icon={<Calendar className="w-4 h-4" />} label="Expiration" value={formatDate(client.expirationDate)} color={color} />
          <DetailRow icon={<Clock className="w-4 h-4" />} label="Durée totale" value={`${client.durationDays} jours`} color="#059669" />
          {client.price > 0 && <DetailRow icon={<DollarSign className="w-4 h-4" />} label="Prix mensuel" value={`${client.price} €`} color="#F59E0B" />}
          {client.notes && <DetailRow icon={<FileText className="w-4 h-4" />} label="Notes" value={client.notes} color="#6B7280" last />}
        </div>

        {/* Renew button */}
        <button
          onClick={() => setShowRenew(true)}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 press shadow-xl shadow-blue-200 animate-fade-in-up"
          style={{ animationDelay: '0.2s' }}
        >
          <RefreshCw className="w-5 h-5" />
          Renouveler l'abonnement
        </button>
      </div>

      {/* Renew bottom sheet */}
      {showRenew && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50 animate-fade-in" onClick={() => setShowRenew(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white rounded-t-3xl z-50 p-6 animate-slide-up safe-bottom">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center mx-auto mb-3 shadow-md`}>
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900">Renouveler l'abonnement</h3>
            <p className="text-center text-gray-500 text-sm mt-1 mb-5">
              <strong className="text-gray-700">{client.name}</strong> — {client.subscriptionType}
            </p>

            <div className="grid grid-cols-4 gap-2 mb-4">
              {RENEW_PRESETS.map(({ label, days: presetDays }) => (
                <button
                  key={presetDays}
                  onClick={() => setRenewDays(String(presetDays))}
                  className={`py-2.5 rounded-xl text-xs font-bold border transition-all press ${
                    parseInt(renewDays) === presetDays
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Durée personnalisée</label>
              <div className="relative">
                <input
                  type="number"
                  value={renewDays}
                  onChange={e => setRenewDays(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">jours</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowRenew(false)} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-100 text-gray-700 font-semibold press">
                Annuler
              </button>
              <button onClick={handleRenew} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold press shadow-lg shadow-blue-200">
                Confirmer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function DetailRow({ icon, label, value, color, last }: {
  icon: React.ReactNode; label: string; value: string; color: string; last?: boolean
}) {
  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 ${!last ? 'border-b border-gray-50' : ''}`}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '18', color }}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-400">{label}</p>
        <p className="text-sm font-semibold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}
