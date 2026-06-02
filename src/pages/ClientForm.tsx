import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { getClient, saveClient, generateId } from '../storage/clientStorage'
import type { Client } from '../types/client'
import Logo from '../components/Logo'

interface FormState {
  name: string
  phoneNumber: string
  subscriptionType: string
  startDate: string
  durationDays: string
  expirationDate: string
  price: string
  notes: string
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

const QUICK_DURATIONS = [
  { label: '1 mois', days: 30 },
  { label: '3 mois', days: 90 },
  { label: '6 mois', days: 180 },
  { label: '1 an', days: 365 },
]

const POPULAR_SUBS = ['Apple Music', 'Netflix', 'Spotify', 'Disney+', 'YouTube Premium', 'Prime Video']

export default function ClientForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [form, setForm] = useState<FormState>({
    name: '', phoneNumber: '', subscriptionType: '',
    startDate: today(), durationDays: '30',
    expirationDate: addDays(today(), 30), price: '', notes: ''
  })
  const [error, setError] = useState('')
  const [showSubSuggestions, setShowSubSuggestions] = useState(false)

  useEffect(() => {
    if (id) {
      const client = getClient(id)
      if (client) {
        setForm({
          name: client.name, phoneNumber: client.phoneNumber,
          subscriptionType: client.subscriptionType, startDate: client.startDate,
          durationDays: String(client.durationDays), expirationDate: client.expirationDate,
          price: client.price ? String(client.price) : '', notes: client.notes
        })
      }
    }
  }, [id])

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value
    setForm(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'startDate' || field === 'durationDays') {
        const dur = parseInt(field === 'durationDays' ? value : prev.durationDays) || 0
        const base = field === 'startDate' ? value : prev.startDate
        next.expirationDate = addDays(base, dur)
      }
      return next
    })
  }

  const setDuration = (days: number) => {
    setForm(prev => ({
      ...prev,
      durationDays: String(days),
      expirationDate: addDays(prev.startDate, days)
    }))
  }

  const handleSave = () => {
    if (!form.name.trim()) { setError('Le nom est obligatoire'); return }
    if (!form.subscriptionType.trim()) { setError("Le type d'abonnement est obligatoire"); return }
    const client: Client = {
      id: id || generateId(), name: form.name.trim(),
      phoneNumber: form.phoneNumber.trim(), subscriptionType: form.subscriptionType.trim(),
      startDate: form.startDate, durationDays: parseInt(form.durationDays) || 30,
      expirationDate: form.expirationDate, price: parseFloat(form.price) || 0,
      notes: form.notes.trim(), isActive: true, createdAt: new Date().toISOString()
    }
    saveClient(client)
    navigate(-1)
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="header-gradient safe-top px-5 pt-5 pb-6 shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center press">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <p className="text-white/60 text-xs uppercase tracking-widest">{isEdit ? 'Modification' : 'Nouveau'}</p>
              <h1 className="text-white text-xl font-bold">{isEdit ? 'Modifier le client' : 'Ajouter un client'}</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-28 space-y-4 animate-fade-in-up">
        {/* Client info card */}
        <FormCard title="👤 Informations client">
          <FormInput label="Nom complet *" type="text" value={form.name} onChange={set('name')} placeholder="Ex: Jean Dupont" />
          <FormInput label="Téléphone" type="tel" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="+33 6 12 34 56 78" />
        </FormCard>

        {/* Subscription card */}
        <FormCard title="📱 Abonnement">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Type d'abonnement *</label>
            <input
              type="text"
              value={form.subscriptionType}
              onChange={e => { set('subscriptionType')(e); setShowSubSuggestions(true) }}
              onFocus={() => setShowSubSuggestions(true)}
              placeholder="Ex: Apple Music, Netflix..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
            />
            {showSubSuggestions && (
              <div className="flex flex-wrap gap-2 mt-2">
                {POPULAR_SUBS.filter(s => s.toLowerCase().includes(form.subscriptionType.toLowerCase()) && s !== form.subscriptionType).slice(0, 4).map(s => (
                  <button
                    key={s}
                    onClick={() => { setForm(p => ({ ...p, subscriptionType: s })); setShowSubSuggestions(false) }}
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-lg border border-blue-100 press"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <FormInput label="Prix mensuel (€)" type="number" value={form.price} onChange={set('price')} placeholder="Ex: 5.99" />
        </FormCard>

        {/* Dates card */}
        <FormCard title="📅 Durée & Dates">
          <FormInput label="Date de début" type="date" value={form.startDate} onChange={set('startDate')} />

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Durée rapide</label>
            <div className="grid grid-cols-4 gap-2">
              {QUICK_DURATIONS.map(({ label, days }) => (
                <button
                  key={days}
                  onClick={() => setDuration(days)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all press ${
                    parseInt(form.durationDays) === days
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <FormInput label="Durée personnalisée (jours)" type="number" value={form.durationDays} onChange={set('durationDays')} placeholder="30" />
          <FormInput label="Date d'expiration" type="date" value={form.expirationDate} onChange={set('expirationDate')} />
        </FormCard>

        {/* Notes */}
        <FormCard title="📝 Notes">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notes (optionnel)</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:bg-white transition-all resize-none"
              placeholder="Informations supplémentaires..."
            />
          </div>
        </FormCard>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
            <span>⚠️</span> {error}
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-4 pb-6 pt-3 bg-gray-50/90 backdrop-blur-sm border-t border-gray-100">
        <button
          onClick={handleSave}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 press shadow-xl shadow-blue-200"
        >
          <Check className="w-5 h-5" />
          Enregistrer le client
        </button>
      </div>
    </div>
  )
}

function FormCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-4 pt-4 pb-1">
        <p className="text-sm font-bold text-gray-800">{title}</p>
      </div>
      <div className="px-4 pb-4 pt-2 space-y-3">{children}</div>
    </div>
  )
}

function FormInput({ label, type, value, onChange, placeholder }: {
  label: string; type: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
      />
    </div>
  )
}
