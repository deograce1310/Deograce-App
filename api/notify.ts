import type { VercelRequest, VercelResponse } from '@vercel/node'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT!)),
  })
}

const db  = getFirestore()
const fcm = getMessaging()

function daysUntil(expirationDate: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(expirationDate)
  exp.setHours(0, 0, 0, 0)
  return Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userRefs = await db.collection('users').listDocuments()
  let sent = 0

  for (const userRef of userRefs) {
    const [clientsSnap, tokensSnap] = await Promise.all([
      userRef.collection('clients').get(),
      userRef.collection('fcmTokens').get(),
    ])
    if (tokensSnap.empty) continue

    const tokens = tokensSnap.docs.map(d => d.data().token as string)

    for (const clientDoc of clientsSnap.docs) {
      const c = clientDoc.data()
      if (!c.isActive) continue

      const days = daysUntil(c.expirationDate)
      let title = '', body = ''

      if (days === 0) {
        title = "⚠️ Abonnement expire aujourd'hui"
        body  = `${c.name} (${c.subscriptionType}) expire aujourd'hui.`
      } else if (days > 0 && days <= 2) {
        title = `⏰ Expiration dans ${days} jour${days > 1 ? 's' : ''}`
        body  = `${c.name} (${c.subscriptionType}) expire bientôt.`
      } else if (days < 0 && Math.abs(days) % 3 === 0) {
        title = `🔴 Non renouvelé — ${Math.abs(days)}j de retard`
        body  = `${c.name} (${c.subscriptionType}) n'a pas été renouvelé.`
      } else {
        continue
      }

      const result = await fcm.sendEachForMulticast({ tokens, notification: { title, body } })
      sent++

      // Supprimer les tokens invalides
      const toDelete = result.responses
        .map((r, i) => r.error?.code === 'messaging/registration-token-not-registered' ? tokens[i] : null)
        .filter(Boolean) as string[]
      for (const t of toDelete) {
        await userRef.collection('fcmTokens').doc(t).delete().catch(() => null)
      }
    }
  }

  res.json({ ok: true, sent })
}
