import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
initializeApp({ credential: cert(serviceAccount) })

const PRUNE_DAYS = 30

function getDaysUntilExpiry(expirationDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(expirationDate)
  if (isNaN(expiry.getTime())) return NaN
  expiry.setHours(0, 0, 0, 0)
  return Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

async function main() {
  const db = getFirestore()
  const messaging = getMessaging()
  const today = new Date().toISOString().split('T')[0]
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - PRUNE_DAYS)

  const usersSnap = await db.collection('users').get()

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id
    const userRef = db.collection('users').doc(uid)

    const tokensSnap = await userRef.collection('fcmTokens').get()
    if (tokensSnap.empty) continue
    const tokens = tokensSnap.docs.map(d => d.id)

    const clientsSnap = await userRef.collection('clients').get()

    for (const clientDoc of clientsSnap.docs) {
      const client = clientDoc.data()
      if (!client.isActive) continue

      const days = getDaysUntilExpiry(client.expirationDate)
      if (isNaN(days)) continue

      let title = null
      let body = null

      if (days === 0) {
        title = "⚠️ Un abonnement expire aujourd'hui"
        body = `${client.name} — l'abonnement arrive à échéance aujourd'hui.`
      } else if (days > 0 && days <= 2) {
        title = `⏰ Expiration dans ${days} jour${days > 1 ? 's' : ''}`
        body = `${client.name} — l'abonnement expire bientôt.`
      } else if (days < 0 && Math.abs(days) % 3 === 0) {
        title = `🔴 Abonnement non renouvelé — ${Math.abs(days)}j de retard`
        body = `${client.name} — l'abonnement n'a toujours pas été renouvelé.`
      }

      if (!title || !body) continue

      const notifKey = `${client.id}-${today}`
      const notifRef = userRef.collection('notified').doc(notifKey)
      if ((await notifRef.get()).exists) continue

      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        webpush: {
          notification: { icon: '/icon-192.png', tag: notifKey },
          fcmOptions: { link: '/' },
        },
      })

      // Supprime les tokens devenus invalides (app désinstallée, etc.)
      await Promise.all(
        response.responses.map((res, i) => {
          if (!res.success && res.error?.code === 'messaging/registration-token-not-registered') {
            return userRef.collection('fcmTokens').doc(tokens[i]).delete()
          }
          return Promise.resolve()
        })
      )

      await notifRef.set({ notifiedAt: today })
    }

    // Purge des anciennes entrées de déduplication
    const notifiedSnap = await userRef.collection('notified').get()
    await Promise.all(
      notifiedSnap.docs.map(d => {
        const notifiedAt = d.data().notifiedAt
        if (notifiedAt && new Date(notifiedAt) < cutoff) return d.ref.delete()
        return Promise.resolve()
      })
    )
  }
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err)
  process.exit(1)
})
