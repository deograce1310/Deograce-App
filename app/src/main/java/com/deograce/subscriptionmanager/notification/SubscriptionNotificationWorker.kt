package com.deograce.subscriptionmanager.notification

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.deograce.subscriptionmanager.DeograceApplication.Companion.CHANNEL_ID
import com.deograce.subscriptionmanager.MainActivity
import com.deograce.subscriptionmanager.R
import com.deograce.subscriptionmanager.data.repository.ClientRepository
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import java.util.concurrent.TimeUnit

@HiltWorker
class SubscriptionNotificationWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted workerParams: WorkerParameters,
    private val repository: ClientRepository
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        val now = System.currentTimeMillis()
        val twoDaysMs = TimeUnit.DAYS.toMillis(2)
        val oneDayMs = TimeUnit.DAYS.toMillis(1)

        // Clients expiring within 2 days
        val soonExpiring = repository.getClientsExpiringBetween(now, now + twoDaysMs + oneDayMs)

        soonExpiring.forEach { client ->
            val daysLeft = ((client.expirationDate - now) / oneDayMs).toInt()
            val message = when {
                daysLeft <= 0 -> "L'abonnement ${client.subscriptionType} de ${client.name} a expiré aujourd'hui !"
                daysLeft == 1 -> "L'abonnement ${client.subscriptionType} de ${client.name} expire demain !"
                else -> "L'abonnement ${client.subscriptionType} de ${client.name} expire dans $daysLeft jours."
            }

            sendNotification(client.id.toInt(), client.name, message)
        }

        return Result.success()
    }

    private fun sendNotification(id: Int, clientName: String, message: String) {
        val intent = Intent(applicationContext, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        val pendingIntent = PendingIntent.getActivity(
            applicationContext, id, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(applicationContext, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle("Expiration: $clientName")
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        try {
            NotificationManagerCompat.from(applicationContext).notify(id, notification)
        } catch (e: SecurityException) {
            // Permission not granted
        }
    }
}
