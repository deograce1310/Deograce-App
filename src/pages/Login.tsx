import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { auth } from '../firebase'

export default function Login() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const clearError = () => setError('')

  const friendlyError = (code: string) => {
    const map: Record<string, string> = {
      'auth/invalid-credential':     'Email ou mot de passe incorrect.',
      'auth/email-already-in-use':   'Cet email est déjà utilisé.',
      'auth/weak-password':          'Le mot de passe doit contenir au moins 6 caractères.',
      'auth/invalid-email':          'Adresse email invalide.',
      'auth/user-not-found':         'Email ou mot de passe incorrect.',
      'auth/wrong-password':         'Email ou mot de passe incorrect.',
      'auth/network-request-failed': 'Erreur réseau. Vérifiez votre connexion.',
    }
    return map[code] ?? `Erreur: ${code || 'inconnue'}`
  }

  const handleEmail = async () => {
    if (!email.trim() || !password) { setError('Remplissez tous les champs.'); return }
    setLoading(true); clearError()
    try {
      if (tab === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password)
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password)
      }
    } catch (e: unknown) {
      const code = (e as { code?: string }).code ?? ''
      setError(friendlyError(code))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true)
    clearError()
    try {
      const gis = (window as unknown as Record<string, unknown>).google as {
        accounts: {
          oauth2: {
            initTokenClient: (cfg: {
              client_id: string
              scope: string
              callback: (r: { access_token?: string; error?: string }) => void
              error_callback?: (e: { type: string }) => void
            }) => { requestAccessToken: () => void }
          }
        }
      } | undefined

      if (!gis?.accounts?.oauth2) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://accounts.google.com/gsi/client'
          s.async = true
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('gis-load-failed'))
          document.head.appendChild(s)
        })
      }

      const g = (window as unknown as Record<string, unknown>).google as typeof gis
      const accessToken = await new Promise<string>((resolve, reject) => {
        g!.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID as string,
          scope: 'email profile openid',
          callback: (r) => {
            if (r.error || !r.access_token) reject(new Error(r.error ?? 'no-token'))
            else resolve(r.access_token)
          },
          error_callback: (e) => reject(new Error(e.type)),
        }).requestAccessToken()
      })

      const credential = GoogleAuthProvider.credential(null, accessToken)
      await signInWithCredential(auth, credential)
    } catch (e: unknown) {
      const msg = (e as { message?: string; code?: string }).message
        ?? (e as { code?: string }).code ?? ''
      if (msg === 'popup_closed_by_user' || msg === 'access_denied') {
        setLoading(false)
        return
      }
      const code = (e as { code?: string }).code ?? ''
      setError(friendlyError(code || msg))
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F2ED] safe-top">
      <div className="flex flex-col items-center pt-14 pb-8 px-6">
        <img src="/logo.png" alt="Deograce" className="h-20 object-contain mb-6 mix-blend-multiply" />
        <p className="text-2xl font-black text-slate-900 text-center">Bienvenue</p>
        <p className="text-sm text-slate-400 text-center mt-1">Gérez vos abonnements clients</p>
      </div>

      {/* Tab switcher */}
      <div className="mx-6 mb-6 flex bg-[#EDE9E3] rounded-2xl p-1">
        {(['login', 'register'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); clearError() }}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}>
            {t === 'login' ? 'Connexion' : 'Inscription'}
          </button>
        ))}
      </div>

      <div className="px-6 flex flex-col gap-4 flex-1">
        {/* Google */}
        <button onClick={handleGoogle} disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-[#EDE9E3] rounded-2xl py-4 press shadow-sm disabled:opacity-60">
          {loading
            ? <span className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            : <><GoogleIcon /><span className="text-sm font-semibold text-slate-800">Continuer avec Google</span></>}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[#EDE9E3]" />
          <span className="text-xs text-slate-400 font-medium">ou</span>
          <div className="flex-1 h-px bg-[#EDE9E3]" />
        </div>

        {/* Email + password */}
        <div className="bg-white border border-[#EDE9E3] rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center px-4 py-3.5 gap-3">
            <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); clearError() }}
              placeholder="Email"
              autoComplete="email"
              className="flex-1 text-sm font-medium text-slate-900 bg-transparent outline-none placeholder-slate-300"
            />
          </div>
          <div className="h-px bg-[#F5F2ED] mx-4" />
          <div className="flex items-center px-4 py-3.5 gap-3">
            <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={e => { setPassword(e.target.value); clearError() }}
              placeholder="Mot de passe"
              autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
              onKeyDown={e => e.key === 'Enter' && handleEmail()}
              className="flex-1 text-sm font-medium text-slate-900 bg-transparent outline-none placeholder-slate-300"
            />
            <button onClick={() => setShowPwd(p => !p)} className="flex-shrink-0 p-1">
              {showPwd ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}

        <button onClick={handleEmail} disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm press shadow-lg shadow-blue-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading
            ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : tab === 'login' ? 'Se connecter' : 'Créer un compte'}
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 px-6 pb-8 pt-4 safe-bottom">
        Vos données sont chiffrées et accessibles uniquement depuis votre compte.
      </p>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.616z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
