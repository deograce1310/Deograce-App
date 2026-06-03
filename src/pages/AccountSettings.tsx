import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
} from 'firebase/auth'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { ChevronLeft, Camera, User, Mail, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { storage } from '../firebase'

type Status = { ok: boolean; msg: string } | null

export default function AccountSettings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)

  const isEmailUser = user?.providerData.some(p => p.providerId === 'password') ?? false

  // ── Profile fields ──
  const [name, setName]         = useState(user?.displayName ?? '')
  const [photoURL, setPhotoURL] = useState<string | null>(null)
  const [profileStatus, setProfileStatus] = useState<Status>(null)
  const [savingProfile, setSavingProfile] = useState(false)

  // ── Email field ──
  const [email, setEmail]         = useState(user?.email ?? '')
  const [emailStatus, setEmailStatus] = useState<Status>(null)

  // ── Password field ──
  const [newPwd, setNewPwd]   = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [pwdStatus, setPwdStatus] = useState<Status>(null)

  // ── Reauth sheet ──
  const [reauthOpen, setReauthOpen]     = useState(false)
  const [reauthPwd, setReauthPwd]       = useState('')
  const [showReauth, setShowReauth]     = useState(false)
  const [reauthError, setReauthError]   = useState('')
  const [reauthLoading, setReauthLoading] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => Promise<void>) | null>(null)

  // ── Helpers ──
  const friendlyErr = (code: string) => ({
    'auth/requires-recent-login':  'Reconnectez-vous pour effectuer cette modification.',
    'auth/email-already-in-use':   'Cet email est déjà utilisé.',
    'auth/invalid-email':          'Adresse email invalide.',
    'auth/wrong-password':         'Mot de passe incorrect.',
    'auth/weak-password':          'Minimum 6 caractères.',
    'auth/too-many-requests':      'Trop de tentatives, réessayez plus tard.',
    'storage/unauthorized':        'Permission refusée. Vérifiez les règles Firebase Storage.',
    'storage/retry-limit-exceeded':"Erreur réseau lors de l'upload. Réessayez.",
    'timeout':                     "L'upload a pris trop de temps. Vérifiez votre connexion.",
  } as Record<string, string>)[code] ?? `Erreur (${code})`

  const withReauth = (action: () => Promise<void>) => {
    setPendingAction(() => action)
    setReauthPwd('')
    setReauthError('')
    setReauthOpen(true)
  }

  const resizePhoto = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = reject
      reader.onload = e => {
        const img = new Image()
        img.onerror = reject
        img.onload = () => {
          const size = Math.min(img.width, img.height)
          const c = document.createElement('canvas')
          c.width = c.height = 200
          c.getContext('2d')!.drawImage(
            img,
            (img.width - size) / 2, (img.height - size) / 2,
            size, size, 0, 0, 200, 200
          )
          resolve(c.toDataURL('image/jpeg', 0.82))
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })

  const handlePickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try { setPhotoURL(await resizePhoto(file)) }
    catch { setProfileStatus({ ok: false, msg: 'Impossible de charger cette image.' }) }
  }

  // ── Save name / photo ──
  const handleSaveProfile = async () => {
    if (!user) return
    setSavingProfile(true)
    setProfileStatus(null)
    try {
      const updates: { displayName?: string; photoURL?: string } = {}
      if (name.trim() !== (user.displayName ?? '')) updates.displayName = name.trim()
      if (photoURL) {
        const avatarRef = ref(storage, `avatars/${user.uid}.jpg`)
        // 15s timeout to avoid infinite spinner if Storage rules block the upload
        await Promise.race([
          uploadString(avatarRef, photoURL, 'data_url'),
          new Promise<never>((_, reject) => setTimeout(() => reject({ code: 'timeout' }), 15000)),
        ])
        updates.photoURL = await getDownloadURL(avatarRef)
      }
      if (Object.keys(updates).length) {
        await updateProfile(user, updates)
        await user.reload()
      }
      setPhotoURL(null)
      setProfileStatus({ ok: true, msg: 'Profil mis à jour.' })
    } catch (e: unknown) {
      setProfileStatus({ ok: false, msg: friendlyErr((e as { code?: string }).code ?? '') })
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Reauth confirm ──
  const handleReauth = async () => {
    if (!user?.email) return
    setReauthLoading(true)
    setReauthError('')
    try {
      await reauthenticateWithCredential(
        user,
        EmailAuthProvider.credential(user.email, reauthPwd)
      )
      setReauthOpen(false)
      await pendingAction?.()
    } catch (e: unknown) {
      setReauthError(friendlyErr((e as { code?: string }).code ?? 'auth/wrong-password'))
    } finally {
      setReauthLoading(false)
    }
  }

  // ── Change email ──
  const handleChangeEmail = () => {
    if (!email.trim() || email.trim() === user?.email) return
    setEmailStatus(null)
    withReauth(async () => {
      try {
        await verifyBeforeUpdateEmail(user!, email.trim())
        setEmailStatus({ ok: true, msg: `Email de vérification envoyé à ${email.trim()}. Cliquez le lien pour confirmer.` })
      } catch (e: unknown) {
        setEmailStatus({ ok: false, msg: friendlyErr((e as { code?: string }).code ?? '') })
      }
    })
  }

  // ── Change password ──
  const handleChangePassword = () => {
    if (!newPwd) return
    setPwdStatus(null)
    withReauth(async () => {
      try {
        await updatePassword(user!, newPwd)
        setNewPwd('')
        setPwdStatus({ ok: true, msg: 'Mot de passe mis à jour.' })
      } catch (e: unknown) {
        setPwdStatus({ ok: false, msg: friendlyErr((e as { code?: string }).code ?? '') })
      }
    })
  }

  const avatar  = photoURL ?? user?.photoURL ?? null
  const initial = (user?.displayName ?? user?.email ?? 'U')[0].toUpperCase()

  return (
    <div className="flex flex-col h-full bg-[#F5F2ED]">

      {/* Header */}
      <div className="bg-[#FDFCFA] safe-top px-5 pt-4 pb-4 border-b border-[#EDE9E3] flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-[#EDE9E3] flex items-center justify-center press">
          <ChevronLeft className="w-4 h-4 text-slate-700" />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Mon compte</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">

        {/* ── Profil card ── */}
        <Card label="Profil">
          {/* Avatar picker */}
          <div className="flex flex-col items-center py-4">
            <button onClick={() => fileRef.current?.click()} className="relative mb-1">
              <div className="w-24 h-24 rounded-2xl bg-blue-50 overflow-hidden flex items-center justify-center">
                {avatar
                  ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-4xl font-black text-blue-400">{initial}</span>}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow">
                <Camera className="w-4 h-4 text-white" />
              </div>
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePickPhoto} />
            <p className="text-xs text-slate-400 mt-2">Appuyez pour changer la photo</p>
          </div>

          <div className="h-px bg-[#F0EDE8] mx-4" />

          {/* Name */}
          <div className="flex items-center gap-3 px-4 py-3">
            <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nom et prénom"
              className="flex-1 text-sm font-medium text-slate-900 bg-transparent outline-none placeholder-slate-300"
            />
          </div>

          <div className="px-4 pb-4 pt-1">
            <button onClick={handleSaveProfile} disabled={savingProfile}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-sm press shadow-sm disabled:opacity-60 flex items-center justify-center">
              {savingProfile
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : 'Enregistrer'}
            </button>
          </div>

          {profileStatus && <StatusBanner ok={profileStatus.ok} msg={profileStatus.msg} />}
        </Card>

        {/* ── Connexion card (email users only) ── */}
        {isEmailUser && (
          <Card label="Connexion">
            {/* Email */}
            <p className="text-xs font-semibold text-slate-400 px-4 pt-4 pb-2">Adresse email</p>
            <div className="flex items-center gap-3 bg-[#F5F2ED] rounded-xl mx-4 px-3 py-2.5 mb-2">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                className="flex-1 text-sm font-medium text-slate-900 bg-transparent outline-none" />
            </div>
            <div className="px-4 mb-4">
              <button onClick={handleChangeEmail}
                disabled={!email.trim() || email.trim() === user?.email}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-[#EDE9E3] text-slate-700 press disabled:opacity-40">
                Changer l'email
              </button>
            </div>
            {emailStatus && <StatusBanner ok={emailStatus.ok} msg={emailStatus.msg} />}

            <div className="h-px bg-[#F0EDE8] mx-4" />

            {/* Password */}
            <p className="text-xs font-semibold text-slate-400 px-4 pt-4 pb-2">Nouveau mot de passe</p>
            <div className="flex items-center gap-3 bg-[#F5F2ED] rounded-xl mx-4 px-3 py-2.5 mb-2">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input type={showPwd ? 'text' : 'password'} value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="Minimum 6 caractères"
                autoComplete="new-password"
                className="flex-1 text-sm font-medium text-slate-900 bg-transparent outline-none placeholder-slate-300" />
              <button onClick={() => setShowPwd(p => !p)} className="flex-shrink-0">
                {showPwd ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
            <div className="px-4 pb-4">
              <button onClick={handleChangePassword} disabled={!newPwd}
                className="w-full py-3 rounded-xl font-semibold text-sm bg-[#EDE9E3] text-slate-700 press disabled:opacity-40">
                Changer le mot de passe
              </button>
            </div>
            {pwdStatus && <StatusBanner ok={pwdStatus.ok} msg={pwdStatus.msg} />}
          </Card>
        )}

        {/* Google notice */}
        {!isEmailUser && (
          <div className="bg-white rounded-2xl border border-[#EDE9E3] shadow-sm px-5 py-4">
            <p className="text-sm text-slate-500 text-center leading-relaxed">
              Compte Google — l'email et le mot de passe sont gérés par Google.
            </p>
          </div>
        )}

      </div>

      {/* ── Reauth sheet ── */}
      {reauthOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50 animate-fade-in" onClick={() => setReauthOpen(false)} />
          <div className="fixed bottom-0 inset-x-0 max-w-[430px] mx-auto bg-[#FDFCFA] rounded-t-3xl z-50 px-6 pt-3 sheet-bottom animate-slide-up">
            <div className="w-8 h-1 bg-slate-200 rounded-full mx-auto mb-6" />
            <p className="font-bold text-slate-900 mb-1">Confirmez votre identité</p>
            <p className="text-sm text-slate-400 mb-5">Entrez votre mot de passe actuel pour continuer.</p>
            <div className="flex items-center gap-3 bg-[#F5F2ED] rounded-xl px-4 py-3 mb-1">
              <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type={showReauth ? 'text' : 'password'}
                value={reauthPwd}
                onChange={e => setReauthPwd(e.target.value)}
                placeholder="Mot de passe actuel"
                autoComplete="current-password"
                onKeyDown={e => e.key === 'Enter' && handleReauth()}
                className="flex-1 text-sm font-medium text-slate-900 bg-transparent outline-none placeholder-slate-300"
              />
              <button onClick={() => setShowReauth(p => !p)} className="flex-shrink-0">
                {showReauth ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
              </button>
            </div>
            {reauthError && <p className="text-xs text-red-500 px-1 mt-1 mb-2">{reauthError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => setReauthOpen(false)}
                className="flex-1 py-3.5 rounded-2xl bg-[#EDE9E3] text-slate-700 font-semibold text-sm press">
                Annuler
              </button>
              <button onClick={handleReauth} disabled={!reauthPwd || reauthLoading}
                className="flex-1 py-3.5 rounded-2xl bg-blue-600 text-white font-semibold text-sm press disabled:opacity-60 flex items-center justify-center">
                {reauthLoading
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

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#EDE9E3] shadow-sm overflow-hidden">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 pt-4">{label}</p>
      {children}
    </div>
  )
}

function StatusBanner({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <div className={`flex items-start gap-2.5 mx-4 mb-4 px-3 py-2.5 rounded-xl border ${ok ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
      {ok
        ? <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
        : <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
      <p className={`text-sm font-medium ${ok ? 'text-green-700' : 'text-red-600'}`}>{msg}</p>
    </div>
  )
}
