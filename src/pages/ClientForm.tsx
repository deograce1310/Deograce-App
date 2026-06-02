import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { getClient, saveClient, generateId } from '../storage/clientStorage'
import type { Client } from '../types/client'

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

export default function ClientForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  const [form, setForm] = useState<FormState>({
    name: '',
    phoneNumber: '',
    subscriptionType: '',
    startDate: today(),
    durationDays: '30',
    expirationDate: addDays(today(), 30),
    price: '',
    notes: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      const client = getClient(id)
      if (client) {
        setForm({
          name: client.name,
          phoneNumber: client.phoneNumber,
          subscriptionType: client.subscriptionType,
          startDate: client.startDate,
          durationDays: String(client.durationDays),
          expirationDate: client.expirationDate,
          price: client.price ? String(client.price) : '',
          notes: client.notes
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

  const handleSave = () => {
    if (!form.name.trim()) { setError('Le nom est obligatoire'); return }
    if (!form.subscriptionType.trim()) { setError("Le type d'abonnement est obligatoire"); return }

    const client: Client = {
      id: id || generateId(),
      name: form.name.trim(),
      phoneNumber: form.phoneNumber.trim(),
      subscriptionType: form.subscriptionType.trim(),
      startDate: form.startDate,
      durationDays: parseInt(form.durationDays) || 30,
      expirationDate: form.expirationDate,
      price: parseFloat(form.price) || 0,
      notes: form.notes.trim(),
      isActive: true,
      createdAt: new Date().toISOString()
    }
    saveClient(client)
    navigate(-1)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-blue-700 safe-top px-4 pb-4 pt-4 flex items-center gap-3 shadow-md">
        <button onClick={() => navigate(-1)} className="text-white p-1">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-white text-xl font-bold flex-1">
          {isEdit ? 'Modifier client' : 'Nouveau client'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24">
        <Section title="Informations client">
          <Field label="Nom complet *" type="text" value={form.name} onChange={set('name')} placeholder="Ex: Jean Dupont" />
          <Field label="Téléphone" type="tel" value={form.phoneNumber} onChange={set('phoneNumber')} placeholder="Ex: +33 6 12 34 56 78" />
        </Section>

        <Section title="Abonnement">
          <Field label="Type d'abonnement *" type="text" value={form.subscriptionType} onChange={set('subscriptionType')} placeholder="Ex: Apple Music, Netflix..." />
          <Field label="Prix (optionnel)" type="number" value={form.price} onChange={set('price')} placeholder="Ex: 5.99" />
        </Section>

        <Section title="Dates">
          <Field label="Date de début" type="date" value={form.startDate} onChange={set('startDate')} />
          <Field label="Durée (jours)" type="number" value={form.durationDays} onChange={set('durationDays')} placeholder="30" />
          <Field label="Date d'expiration" type="date" value={form.expirationDate} onChange={set('expirationDate')} />
        </Section>

        <Section title="Notes">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Notes (optionnel)</label>
            <textarea
              value={form.notes}
              onChange={set('notes')}
              rows={3}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500"
              placeholder="Informations supplémentaires..."
            />
          </div>
        </Section>

        {error && <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <button
          onClick={handleSave}
          className="w-full bg-blue-700 text-white py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 active:bg-blue-800 transition-colors shadow-md"
        >
          <Save className="w-5 h-5" />
          Enregistrer
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2 px-1">{title}</p>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        {children}
      </div>
    </div>
  )
}

function Field({
  label, type, value, onChange, placeholder
}: {
  label: string; type: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition-colors"
      />
    </div>
  )
}
