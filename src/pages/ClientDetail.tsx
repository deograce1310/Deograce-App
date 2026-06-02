import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, RefreshCw, Phone, Calendar, Clock, DollarSign, FileText, Hourglass } from 'lucide-react'
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    })
  }

  const handleRenew = () => {
    const d = parseInt(renewDays) || 30
    const newExpiry = new Date()
    newExpiry.setDate(newExpiry.getDate() + d)
    const updated: Client = {
      ...client,
      startDate: new Date().toISOString().split('T')[0],
      durationDays: d,
      expirationDate: newExpiry.toISOString().split('T')[0],
      isActive: true
    }
    saveClient(updated)
    setClient(updated)
    setShowRenew(false)
  }

  const initial = client.name.charAt(0).toUpperCase()

  return (
    <div className="flex flex-col h-full">
      <div className="bg-blue-700 safe-top px-4 pb-4 pt-4 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate(-1)} className="text-white p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl font-bold flex-1 truncate">{client.name}</h1>
        <button onClick={() => navigate(`/client/${id}/edit`)} className="text-white p-1">
          <Edit className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        {/* Avatar & status header */}
        <div className="px-4 py-6 flex flex-col items-center" style={{ backgroundColor: color + '18' }}>
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold mb-3"
            style={{ backgroundColor: color + '33', color }}
          >
            {initial}
          </div>
          <p className="text-xl font-bold text-gray-900">{client.name}</p>
          <p className="text-blue-700 font-medium mt-0.5">{client.subscriptionType}</p>
          <span
            className="mt-3 text-sm font-bold px-4 py-1.5 rounded-full"
            style={{ color, backgroundColor: color + '22' }}
          >
            {statusLabel(status)}
          </span>
        </div>

        {/* Details card */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {client.phoneNumber && <DetailRow icon={<Phone className="w-4 h-4" />} label="Téléphone" value={client.phoneNumber} />}
          <DetailRow icon={<Calendar className="w-4 h-4" />} label="Date de début" value={formatDate(client.startDate)} />
          <DetailRow icon={<Calendar className="w-4 h-4" />} label="Date d'expiration" value={formatDate(client.expirationDate)} />
          <DetailRow icon={<Clock className="w-4 h-4" />} label="Durée" value={`${client.durationDays} jours`} />
          {days >= 0 && <DetailRow icon={<Hourglass className="w-4 h-4" />} label="Jours restants" value={`${days} jours`} />}
          {client.price > 0 && <DetailRow icon={<DollarSign className="w-4 h-4" />} label="Prix" value={`${client.price} €`} />}
          {client.notes && <DetailRow icon={<FileText className="w-4 h-4" />} label="Notes" value={client.notes} />}
        </div>

        {/* Renew button */}
        <div className="mx-4 mt-4">
          <button
            onClick={() => setShowRenew(true)}
            className="w-full bg-blue-700 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 active:bg-blue-800 shadow-md"
          >
            <RefreshCw className="w-5 h-5" />
            Renouveler l'abonnement
          </button>
        </div>
      </div>

      {/* Renew modal */}
      {showRenew && (
        <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-3xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Renouveler l'abonnement</h3>
            <p className="text-sm text-gray-500 mb-4">Durée pour <strong>{client.name}</strong></p>
            <label className="block text-sm font-medium text-gray-600 mb-1">Nombre de jours</label>
            <input
              type="number"
              value={renewDays}
              onChange={e => setRenewDays(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRenew(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleRenew}
                className="flex-1 py-3 rounded-xl bg-blue-700 text-white font-medium"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span className="text-blue-600 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value}</p>
      </div>
    </div>
  )
}
