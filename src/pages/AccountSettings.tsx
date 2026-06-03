import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  updateProfile,
  verifyBeforeUpdateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth'
import { ChevronLeft, Camera, User, Mail, Lock, Check, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function AccountSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const isEmailUser = user?.providerData.some(p => p.providerId === 'password') ?? false

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [email, setEmail] = useState(user?.email ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [showReauth, setShowReauth] = useState(false)
  const [reauthPassword, setReauthPassword] = useState('')
  const [reauthShowPwd, setReauthShowPwd] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null)

  const friendlyError = (code: string) => {
    const map: Record<string, string> = {
      'auth/requires-recent-login':  'Reconnectez-vous pour effectuer cette modification.',
      'auth/email-already-in-use':   'Cet email est déjà utilisé.',
      'auth/invalid-email':          'Adresse email invalide.',
      'auth/wrong-password':         'Mot de passe incorrect.',
      'auth/weak-password':          'Le mot de passe doit contenir au moins 6 caractères.',
      'auth/too-many-requests':      'Trop de tentatives. Réessayez plus tard.',
    }
    return map[code] ?? `Erreur : ${code}`
  }

  const resizeImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        const img = new Image()
        img.onload = () => {
          const size = Math.min(img.width, img.height)
          const canvas = document.createElement('canvas')
          canvas.width = 200
          canvas.height = 200
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, (img.width - size) / 2, (img.height - size) / 2, size, size, 0, 0, 200, 200)
          resolve(canvas.toDataURL('image/jpeg', 0.82))
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setPhotoPreview(await resizeImage(file))
      setError('')
    } catch {
      setError('Impossible de charger cette image.')
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    setLoading(true); setError(''); setSuccess('')
    try {
      const updates: { displayName?: string; photoURL?: string } = {}
      if (displayName.trim() !== (user.displayName ?? '')) updates.displayName = displayName.trim()
      if (photoPreview) updates.photoURL = photoPreview
      if (Object.keys(updates).length > 0) await updateProfile(user, updates)
      setPhotoPreview(null)
      setSuccess('Profil mis à jour.')
    } catch (e: unknown) {
      setError(friendlyError((e as { code?: string }).code ?? ''))
    } finally {
      setLoading(false)
    }
  }

  const requireReauth = (action: () => Promise<void>) => {
    setPendingAction(() => action)
    setReauthPassword('')
    setShowReauth(true)
  }

  const handleReauth = async () => {
    if (!user?.email) return
    setLoading(true); setError('')
    try {
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, reauthPassword)
      )
      setShowReauth(false)
      await pendingAction?.()
    } catch (e: unknown) {
      setError(friendlyError((e as { code?: string }).code ?? 'auth/wrong-password'))
    } finally {
      setLoading(false)
    }
  }

  const handleChangeEmail = () => {
    if (!email.trim() || email.trim() === user?.email) return
    requireReauth(async () => {
      await verifyBeforeUpdateEmail(auth.currentUser!, email.trim())
      setSuccess(`Un email de vérification a été envoyé à ${email.trim()}. Cliquez le lien pour confirmer le changement.`)
    })
  }

  const handleChangePassword = () => {
    if (!newPassword) return
    requireReauth(async () => {
      await updatePassword(auth.currentUser!, newPassword)
      setNewPassword('')
      setSuccess('Mot de passe mis à jour.')
    })
  }

  const currentPhoto = photoPreview ?? user?.photoURL ?? null

  return (
    <div className="flex flex-col h-full bg-[#F5F2ED]">
      {/* Header */}
      <div className="bg-[#FDFCFA] safe-top px-5 pt-4 pb-4 border-b border-[#EDE9E3]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-[#EDE9E3] flex items-center justify-center press">
            <ChevronLeft className="w-4 h-4 text-slate-700" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">Mon compte</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-5">

        {/* ── Photo + Nom ── */}
        <div className="bg-white rounded-2xl border border-[#EDE9E3] shadow-sm p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Profil</p>

          <div className="flex flex-col items-center mb-5">
            <button onClick={() => fileRef.current?.click()} className="relative">
              <div className="w-24 h-24 rounded-2xl bg-blue-50 overflow-hidden flex items-center justify-center">
                {currentPhoto
                  ? <img src={currentPhoto} alt="" className="w-full h-full object-cover" />
                  : <span className="text-4xl font-black text-blue-400">
                      {(user?.displayName ?? user?.email ?? 'U')[0].toUpperCase()}
                    </span>}
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <p className="text-xs text-slate-400 mt-3">Appuyez pour changer la photo</p>
          </div>

          <div className="flex items-center gap-3 bg-[#F5F2ED] rounded-xl px-4 py-3">
            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Nom et prénom"
              className="flex-1 text-sm font-medium text-slate-900 bg-transparent outline-none placeholder-slate-300"
            />
          </div>

          <button onClick={handleSaveProfile} disabled={loading}
            className="w-full mt-4 bg-blue-600 text-white py-3.5 rounded-xl font-bold text-sm press shadow-sm shadow-blue-100 disabled:opacity-60 flex items-center justify-center">
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Enregistrer le profil'}
          </button>
        </div>

        {/* ── Email + Mot de passe (email users seulement) ── */}
        {isEmailUser && (
          <div className="bg-white rounded-2xl border border-[#EDE9E3] shadow-sm p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Connexion</p>

            {/* Email */}
            <p className="text-xs font-semibold text-slate-500 mb-2">Adresse email</p>
            <div className="flex items-center gap-3 bg-[#F5F2ED] rounded-xl px-4 py-3 mb-3">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className="flex-1 text-sm font-medium text-slate-900 bg-transparent outline-none"
              />
            </div>
            <button onClick={handleChangeEmail}
              disabled={loading || !email.trim() || email.trim() === user?.email}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-[#EDE9E3] text-slate-700 press disabled:opacity-40 mb-5">
              Changer l'email
            </button>

            <div className="h-px bg-[#EDE9E3] mb-5" />

            {/* Password */}
            <p className="text-xs font-semibold text-slate-500 mb-2">Nouveau mot de passe</p>
            <div className="flex items-center gap-3 bg-[#F5F2ED] rounded-xl px-4 py-3 mb-3">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type={showNewPwd ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caractères"
                autoComplete="new-password"
                className="flex-1 text-sm font-medium text-slate-900 bg-transparent outline-none placeholder-slate-300"
              />
              <button onClick={() => setShowNewPwd(p => !p)} className="flex-shrink-0">
                {showNewPwd ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
            <button onClick={handleChangePassword} disabled={loading || !newPassword}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-[#EDE9E3] text-slate-700 press disabled:opacity-40">
              Changer le mot de passe
            </button>
          </div>
        )}

        {/* Google info */}
        {!isEmailUser && (
          <div className="bg-white rounded-2xl border border-[#EDE9E3] shadow-sm px-5 py-4">
            <p className="text-sm text-slate-500 text-center leading-relaxed">
              Compte Google — l'email et le mot de passe sont gérés directement par Google.
            </p>
          </div>
        )}

        {/* Messages */}
        {success && (
          <div className="flex items-start gap-2.5 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* ── Reauthentication sheet ── */}
      {showReauth && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={() => setShowReauth(false)} />
          <div className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto bg-[#FDFCFA] rounded-t-3xl z-50 px-6 pt-3 sheet-bottom animate-slide-up">
            <div className="w-8 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
            <p className="font-bold text-slate-900 mb-1">Confirmez votre identité</p>
            <p className="text-sm text-slate-400 mb-5">Entrez votre mot de passe actuel pour continuer.</p>
            <div className="flex items-center gap-3 bg-[#F5F2ED] rounded-xl px-4 py-3 mb-4">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type={reauthShowPwd ? 'text' : 'password'}
                value={reauthPassword}
                onChange={e => setReauthPassword(e.target.value)}
                placeholder="Mot de passe actuel"
                autoComplete="current-password"
                onKeyDown={e => e.key === 'Enter' && handleReauth()}
                className="flex-1 text-sm font-medium text-slate-900 bg-transparent outline-none placeholder-slate-300"
              />
              <button onClick={() => setReauthShowPwd(p => !p)} className="flex-shrink-0">
                {reauthShowPwd ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReauth(false)}
                className="flex-1 py-3.5 rounded-2xl bg-[#EDE9E3] text-slate-700 font-semibold text-sm press">
                Annuler
              </button>
              <button onClick={handleReauth} disabled={!reauthPassword || loading}
                className="flex-1 py-3.5 rounded-2xl bg-blue-600 text-white font-semibold text-sm press disabled:opacity-60 flex items-center justify-center">
                {loading
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : 'Confirmer'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
