import { useState, useEffect } from 'react'
import { sendEmailVerification } from 'firebase/auth'
import { MailCheck, RefreshCw, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function VerifyEmail() {
  const { user, logout } = useAuth()
  const [cooldown, setCooldown] = useState(0)
  const [sent, setSent] = useState(false)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  const resend = async () => {
    if (!user || cooldown > 0) return
    try {
      await sendEmailVerification(user)
      setSent(true)
      setCooldown(60)
    } catch {
      // silently ignore (rate limit etc)
    }
  }

  const checkVerified = async () => {
    if (!user) return
    setChecking(true)
    await user.reload()
    // If verified, AuthContext will update and App.tsx will redirect automatically
    setChecking(false)
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F2ED] safe-top items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center gap-6">

        <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center">
          <MailCheck className="w-10 h-10 text-blue-500" />
        </div>

        <div className="text-center">
          <p className="text-2xl font-black text-slate-900">Vérifiez votre email</p>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Un lien de confirmation a été envoyé à
          </p>
          <p className="text-sm font-semibold text-slate-800 mt-1 break-all">{user?.email}</p>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Cliquez sur le lien dans l'email puis revenez ici.
          </p>
        </div>

        <button
          onClick={checkVerified}
          disabled={checking}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-sm press shadow-lg shadow-blue-100 disabled:opacity-60 flex items-center justify-center gap-2">
          {checking
            ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <><RefreshCw className="w-4 h-4" />J'ai vérifié mon email</>}
        </button>

        <button
          onClick={resend}
          disabled={cooldown > 0}
          className="w-full bg-white border border-[#EDE9E3] text-slate-700 py-4 rounded-2xl font-semibold text-sm press shadow-sm disabled:opacity-50">
          {cooldown > 0
            ? `Renvoyer dans ${cooldown}s`
            : sent ? 'Renvoyer l\'email' : 'Renvoyer l\'email de confirmation'}
        </button>

        {sent && cooldown > 0 && (
          <p className="text-xs text-green-600 font-medium">Email envoyé !</p>
        )}

        <button onClick={logout} className="flex items-center gap-2 text-sm text-slate-400 mt-2 press">
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
