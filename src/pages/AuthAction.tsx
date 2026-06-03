import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth'
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { auth } from '../firebase'

export default function AuthAction() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const mode = params.get('mode')
  const oobCode = params.get('oobCode') ?? ''

  if (mode === 'resetPassword') return <ResetPassword oobCode={oobCode} onDone={() => navigate('/', { replace: true })} />

  return (
    <div className="flex items-center justify-center h-full bg-[#F5F2ED] px-6">
      <p className="text-slate-500 text-sm">Lien invalide ou expiré.</p>
    </div>
  )
}

function ResetPassword({ oobCode, onDone }: { oobCode: string; onDone: () => void }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    if (!oobCode) { setError('Code manquant.'); return }
    verifyPasswordResetCode(auth, oobCode)
      .then(e => setEmail(e))
      .catch(() => setError('Ce lien est invalide ou a déjà été utilisé. Demandez un nouveau lien.'))
  }, [oobCode])

  const handleSubmit = async () => {
    if (password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères.'); return }
    if (password !== confirm) { setError('Les mots de passe ne correspondent pas.'); return }
    setLoading(true); setError('')
    try {
      await confirmPasswordReset(auth, oobCode, password)
      setDone(true)
      setTimeout(onDone, 2500)
    } catch {
      setError('Échec de la réinitialisation. Demandez un nouveau lien.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#F5F2ED] px-6 gap-4">
        <div className="w-16 h-16 rounded-3xl bg-green-50 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <p className="text-xl font-black text-slate-900">Mot de passe modifié !</p>
        <p className="text-sm text-slate-500">Redirection en cours…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F2ED] safe-top">
      <div className="flex flex-col items-center pt-14 pb-8 px-6">
        <img src="/logo.png" alt="SubTrack" className="h-20 object-contain mb-6 mix-blend-multiply" />
        <p className="text-2xl font-black text-slate-900 text-center">Nouveau mot de passe</p>
        {email && <p className="text-sm text-slate-400 text-center mt-1">{email}</p>}
      </div>

      <div className="px-6 flex flex-col gap-4 flex-1">
        {error ? (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        ) : (
          <>
            <div className="bg-white border border-[#EDE9E3] rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center px-4 py-3.5 gap-3">
                <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  autoComplete="new-password"
                  className="flex-1 text-sm font-medium text-slate-900 bg-transparent outline-none placeholder-slate-300"
                />
                <button onClick={() => setShowPwd(p => !p)} className="flex-shrink-0 p-1">
                  {showPwd ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
              <div className="h-px bg-[#F5F2ED] mx-4" />
              <div className="flex items-center px-4 py-3.5 gap-3">
                <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Confirmer le mot de passe"
                  autoComplete="new-password"
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="flex-1 text-sm font-medium text-slate-900 bg-transparent outline-none placeholder-slate-300"
                />
              </div>
            </div>

            <button onClick={handleSubmit} disabled={loading || !email}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm press shadow-lg shadow-blue-100 disabled:opacity-60 flex items-center justify-center gap-2">
              {loading
                ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Enregistrer le mot de passe'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
