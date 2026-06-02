import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getClient, saveClient, generateId } from '../storage/clientStorage'
import type { Client } from '../types/client'

interface FormState {
  name: string; phoneNumber: string; subscriptionType: string
  startDate: string; durationDays: string; expirationDate: string
  price: string; notes: string
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

const today = () => new Date().toISOString().split('T')[0]

const DURATION_PRESETS = [
  { label: '1 mois', days: 30 },
  { label: '3 mois', days: 90 },
  { label: '6 mois', days: 180 },
  { label: '1 an', days: 365 },
]

const SUB_SUGGESTIONS = ['Apple Music', 'Netflix', 'Spotify', 'Disney+', 'YouTube Premium', 'Prime Video', 'Canal+', 'Deezer']

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

  useEffect(() => {
    if (id) {
      const c = getClient(id)
      if (c) setForm({
        name: c.name, phoneNumber: c.phoneNumber, subscriptionType: c.subscriptionType,
        startDate: c.startDate, durationDays: String(c.durationDays),
        expirationDate: c.expirationDate, price: c.price ? String(c.price) : '', notes: c.notes
      })
    }
  }, [id])

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value
    setForm(p => {
      const n = { ...p, [field]: v }
      if (field === 'startDate') {
        // Début change → recalcule fin à partir de la durée existante
        const dur = parseInt(p.durationDays) || 0
        n.expirationDate = addDays(v, dur)
      } else if (field === 'durationDays') {
        // Durée change → recalcule fin à partir du début existant
        const dur = parseInt(v) || 0
        n.expirationDate = addDays(p.startDate, dur)
      } else if (field === 'expirationDate' && v) {
        // Fin change → recalcule durée en jours entre début et fin
        const start = new Date(p.startDate)
        const end = new Date(v)
        const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        n.durationDays = diff > 0 ? String(diff) : '0'
      }
      return n
    })
  }

  const setDur = (days: number) => setForm(p => ({
    ...p, durationDays: String(days), expirationDate: addDays(p.startDate, days)
  }))

  const handleSave = () => {
    if (!form.name.trim()) { setError('Le nom est obligatoire'); return }
    if (!form.subscriptionType.trim()) { setError("Le type d'abonnement est obligatoire"); return }
    saveClient({
      id: id || generateId(), name: form.name.trim(), phoneNumber: form.phoneNumber.trim(),
      subscriptionType: form.subscriptionType.trim(), startDate: form.startDate,
      durationDays: parseInt(form.durationDays) || 30, expirationDate: form.expirationDate,
      price: parseFloat(form.price) || 0, notes: form.notes.trim(),
      isActive: true, createdAt: new Date().toISOString()
    } as Client)
    navigate(-1)
  }

  const filteredSuggestions = SUB_SUGGESTIONS.filter(s =>
    form.subscriptionType.length > 0 &&
    s.toLowerCase().includes(form.subscriptionType.toLowerCase()) &&
    s.toLowerCase() !== form.subscriptionType.toLowerCase()
  )

  return (
    <div className="flex flex-col h-full bg-[#F5F2ED]">
      {/* Header */}
      <div className="bg-[#FDFCFA] safe-top px-4 pt-4 pb-4 border-b border-[#EDE9E3] flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-full bg-[#EDE9E3] flex items-center justify-center press flex-shrink-0">
          <ArrowLeft className="w-4 h-4 text-slate-700" />
        </button>
        <div className="flex-1">
          <p className="text-xs text-slate-400 font-medium">{isEdit ? 'Modifier' : 'Nouveau'}</p>
          <p className="text-base font-bold text-slate-900 leading-tight">
            {isEdit ? 'Modifier le client' : 'Ajouter un client'}
          </p>
        </div>
        <img src="/logo.png" alt="" className="h-9 object-contain opacity-60" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-5 pb-32 space-y-5 animate-fade-in-up">
        {/* Client */}
        <FieldGroup label="Client">
          <Field label="Nom complet" required value={form.name} onChange={set('name')} placeholder="Jean Dupont" />
          <Divider />
          <Field label="Téléphone" type="tel" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="+33 6 12 34 56 78" />
        </FieldGroup>

        {/* Abonnement */}
        <FieldGroup label="Abonnement">
          <Field label="Type d'abonnement" required value={form.subscriptionType} onChange={set('subscriptionType')} placeholder="Apple Music, Netflix..." />
          {filteredSuggestions.length > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {filteredSuggestions.slice(0, 4).map(s => (
                <button key={s} onClick={() => setForm(p => ({ ...p, subscriptionType: s }))}
                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-medium border border-blue-100 press">
                  {s}
                </button>
              ))}
            </div>
          )}
          <Divider />
          <Field label="Prix mensuel (€)" type="number" value={form.price} onChange={set('price')} placeholder="5.99" />
        </FieldGroup>

        {/* Durée */}
        <FieldGroup label="Durée">
          <div className="px-4 py-3 grid grid-cols-4 gap-2">
            {DURATION_PRESETS.map(({ label, days }) => (
              <button key={days} onClick={() => setDur(days)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all press ${
                  parseInt(form.durationDays) === days
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100'
                    : 'bg-[#EDE9E3] text-slate-600'
                }`}>
                {label}
              </button>
            ))}
          </div>
          <Divider />
          <Field label="Jours personnalisés" type="number" value={form.durationDays} onChange={set('durationDays')} placeholder="30" />
          <Divider />
          <Field label="Date de début" type="date" value={form.startDate} onChange={set('startDate')} />
          <Divider />
          <Field label="Date d'expiration" type="date" value={form.expirationDate} onChange={set('expirationDate')} />
        </FieldGroup>

        {/* Notes */}
        <FieldGroup label="Notes">
          <div className="px-4 py-3">
            <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Informations supplémentaires..."
              className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-300 outline-none resize-none" />
          </div>
        </FieldGroup>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}
      </div>

      {/* Save */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#FDFCFA] border-t border-[#EDE9E3] px-4 py-4 safe-bottom">
        <button onClick={handleSave}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm press shadow-lg shadow-blue-100 active:bg-blue-700">
          {isEdit ? 'Enregistrer les modifications' : 'Ajouter le client'}
        </button>
      </div>
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">{label}</p>
      <div className="bg-[#FDFCFA] rounded-2xl border border-[#EDE9E3] shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  )
}

function Divider() {
  return <div className="h-px bg-[#F5F2ED] mx-4" />
}

function Field({ label, type = 'text', value, onChange, placeholder, required }: {
  label: string; type?: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string; required?: boolean
}) {
  return (
    <div className="flex items-center px-4 py-3 gap-3">
      <p className="text-sm text-slate-500 w-36 flex-shrink-0">{label}{required && <span className="text-blue-500 ml-0.5">*</span>}</p>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        className="flex-1 text-sm font-medium text-slate-900 text-right bg-transparent outline-none placeholder-slate-300" />
    </div>
  )
}
