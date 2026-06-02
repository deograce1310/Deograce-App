import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Search, Check } from 'lucide-react'
import { getClient, saveClient, generateId } from '../storage/clientStorage'
import { useAuth } from '../contexts/AuthContext'
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
  { label: '1 mois',  days: 30 },
  { label: '2 mois',  days: 60 },
  { label: '3 mois',  days: 90 },
  { label: '4 mois',  days: 120 },
  { label: '5 mois',  days: 150 },
  { label: '6 mois',  days: 180 },
  { label: '7 mois',  days: 210 },
  { label: '8 mois',  days: 240 },
  { label: '9 mois',  days: 270 },
  { label: '10 mois', days: 300 },
  { label: '11 mois', days: 330 },
  { label: '12 mois', days: 365 },
]

const SUB_LIST = [
  'Apple Music', 'Apple TV+', 'Canal+', 'Crunchyroll', 'Deezer',
  'Disney+', 'Netflix', 'Prime Video', 'Spotify', 'Tidal',
  'YouTube Premium',
]

export default function ClientForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const isEdit = !!id

  const [form, setForm] = useState<FormState>({
    name: '', phoneNumber: '', subscriptionType: '',
    startDate: today(), durationDays: '30',
    expirationDate: addDays(today(), 30), price: '', notes: ''
  })
  const [error, setError] = useState('')
  const [showDurPicker, setShowDurPicker] = useState(false)
  const [showSubPicker, setShowSubPicker] = useState(false)
  const [subSearch, setSubSearch] = useState('')
  const subSearchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (id && user) {
      getClient(user.uid, id).then(c => {
        if (c) setForm({
          name: c.name, phoneNumber: c.phoneNumber, subscriptionType: c.subscriptionType,
          startDate: c.startDate, durationDays: String(c.durationDays),
          expirationDate: c.expirationDate, price: c.price ? String(c.price) : '', notes: c.notes
        })
      })
    }
  }, [id, user])

  useEffect(() => {
    if (showSubPicker) {
      setSubSearch('')
      setTimeout(() => subSearchRef.current?.focus(), 100)
    }
  }, [showSubPicker])

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value
    setForm(p => {
      const n = { ...p, [field]: v }
      if (field === 'startDate') {
        const dur = parseInt(p.durationDays) || 0
        n.expirationDate = addDays(v, dur)
      } else if (field === 'durationDays') {
        const dur = parseInt(v) || 0
        n.expirationDate = addDays(p.startDate, dur)
      } else if (field === 'expirationDate' && v) {
        const start = new Date(p.startDate)
        const end = new Date(v)
        const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        n.durationDays = diff > 0 ? String(diff) : '0'
      }
      return n
    })
  }

  const setDur = (days: number) => {
    setForm(p => ({ ...p, durationDays: String(days), expirationDate: addDays(p.startDate, days) }))
    setShowDurPicker(false)
  }

  const setSub = (name: string) => {
    setForm(p => ({ ...p, subscriptionType: name }))
    setShowSubPicker(false)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Le nom est obligatoire'); return }
    if (!form.subscriptionType.trim()) { setError("Le type d'abonnement est obligatoire"); return }
    if (!user) return
    await saveClient(user.uid, {
      id: id || generateId(), name: form.name.trim(), phoneNumber: form.phoneNumber.trim(),
      subscriptionType: form.subscriptionType.trim(), startDate: form.startDate,
      durationDays: parseInt(form.durationDays) || 30, expirationDate: form.expirationDate,
      price: parseFloat(form.price) || 0, notes: form.notes.trim(),
      isActive: true, createdAt: new Date().toISOString()
    } as Client)
    navigate(-1)
  }

  const currentDurLabel = DURATION_PRESETS.find(p => String(p.days) === form.durationDays)?.label
    ?? `${form.durationDays} jours`

  const filteredSubs = SUB_LIST.filter(s =>
    s.toLowerCase().includes(subSearch.toLowerCase())
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
        <img src="/logo.png" alt="" className="h-9 object-contain mix-blend-multiply" />
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
          <button
            onClick={() => setShowSubPicker(true)}
            className="w-full flex items-center px-4 py-3 gap-3 active:bg-[#F5F2ED] transition-colors"
          >
            <p className="text-sm text-slate-500 w-36 flex-shrink-0 text-left">
              Type d'abonnement<span className="text-blue-500 ml-0.5">*</span>
            </p>
            <p className={`flex-1 text-sm font-medium text-right truncate ${form.subscriptionType ? 'text-slate-900' : 'text-slate-300'}`}>
              {form.subscriptionType || 'Choisir…'}
            </p>
            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
          </button>
          <Divider />
          <Field label="Prix (FCFA)" type="number" value={form.price} onChange={set('price')} placeholder="5000" />
        </FieldGroup>

        {/* Durée */}
        <FieldGroup label="Durée">
          <button
            onClick={() => setShowDurPicker(true)}
            className="w-full flex items-center px-4 py-3 gap-3 active:bg-[#F5F2ED] transition-colors"
          >
            <p className="text-sm text-slate-500 w-36 flex-shrink-0 text-left">Période</p>
            <p className="flex-1 text-sm font-semibold text-slate-900 text-right">{currentDurLabel}</p>
            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
          </button>
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

      {/* Duration picker sheet */}
      {showDurPicker && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={() => setShowDurPicker(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#FDFCFA] rounded-t-3xl z-50 px-6 pt-3 pb-8 safe-bottom animate-slide-up">
            <div className="w-8 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <p className="text-base font-bold text-slate-900 mb-4">Choisir la durée</p>
            <div className="overflow-y-auto max-h-72 -mx-2 px-2 space-y-1">
              {DURATION_PRESETS.map(({ label, days }) => {
                const selected = String(days) === form.durationDays
                return (
                  <button
                    key={days}
                    onClick={() => setDur(days)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all press ${
                      selected ? 'bg-blue-600 text-white' : 'bg-[#EDE9E3] text-slate-800'
                    }`}
                  >
                    <span className="font-semibold text-sm">{label}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${selected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {days} jours
                      </span>
                      {selected && <Check className="w-4 h-4" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Subscription picker sheet */}
      {showSubPicker && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={() => setShowSubPicker(false)} />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#FDFCFA] rounded-t-3xl z-50 px-6 pt-3 pb-8 safe-bottom animate-slide-up">
            <div className="w-8 h-1 bg-slate-200 rounded-full mx-auto mb-5" />
            <p className="text-base font-bold text-slate-900 mb-4">Type d'abonnement</p>

            {/* Search */}
            <div className="flex items-center bg-[#EDE9E3] rounded-xl px-3 py-2.5 mb-4 gap-2">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                ref={subSearchRef}
                type="text"
                value={subSearch}
                onChange={e => setSubSearch(e.target.value)}
                placeholder="Rechercher ou saisir…"
                className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
              />
            </div>

            <div className="overflow-y-auto max-h-60 -mx-2 px-2 space-y-1">
              {/* Custom entry if typed and not in list */}
              {subSearch.trim() && !SUB_LIST.some(s => s.toLowerCase() === subSearch.toLowerCase()) && (
                <button
                  onClick={() => setSub(subSearch.trim())}
                  className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-blue-50 border border-blue-100 press"
                >
                  <span className="text-sm font-semibold text-blue-700">"{subSearch.trim()}"</span>
                  <span className="text-xs text-blue-400 font-medium">Personnalisé</span>
                </button>
              )}
              {filteredSubs.map(s => {
                const selected = form.subscriptionType === s
                return (
                  <button
                    key={s}
                    onClick={() => setSub(s)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all press ${
                      selected ? 'bg-blue-600 text-white' : 'bg-[#EDE9E3] text-slate-800'
                    }`}
                  >
                    <span className="font-semibold text-sm">{s}</span>
                    {selected && <Check className="w-4 h-4" />}
                  </button>
                )
              })}
              {filteredSubs.length === 0 && !subSearch.trim() && (
                <p className="text-center text-slate-400 text-sm py-4">Aucun résultat</p>
              )}
            </div>
          </div>
        </>
      )}
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
