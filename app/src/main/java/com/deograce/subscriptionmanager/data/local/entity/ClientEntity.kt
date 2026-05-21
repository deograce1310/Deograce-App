package com.deograce.subscriptionmanager.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "clients")
data class ClientEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val phoneNumber: String,
    val subscriptionType: String,
    val startDate: Long,
    val durationDays: Int,
    val expirationDate: Long,
    val price: Double = 0.0,
    val notes: String = "",
    val isActive: Boolean = true
)
