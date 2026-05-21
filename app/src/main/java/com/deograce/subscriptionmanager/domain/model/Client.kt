package com.deograce.subscriptionmanager.domain.model

import java.time.LocalDate

data class Client(
    val id: Long = 0,
    val name: String,
    val phoneNumber: String,
    val subscriptionType: String,
    val startDate: LocalDate,
    val durationDays: Int,
    val expirationDate: LocalDate,
    val price: Double = 0.0,
    val notes: String = "",
    val isActive: Boolean = true
) {
    val daysUntilExpiration: Long
        get() = LocalDate.now().until(expirationDate, java.time.temporal.ChronoUnit.DAYS)

    val status: SubscriptionStatus
        get() = when {
            !isActive -> SubscriptionStatus.INACTIVE
            daysUntilExpiration < 0 -> SubscriptionStatus.EXPIRED
            daysUntilExpiration <= 2 -> SubscriptionStatus.EXPIRING_SOON
            else -> SubscriptionStatus.ACTIVE
        }
}

enum class SubscriptionStatus { ACTIVE, EXPIRING_SOON, EXPIRED, INACTIVE }
