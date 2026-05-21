package com.deograce.subscriptionmanager.domain.mapper

import com.deograce.subscriptionmanager.data.local.entity.ClientEntity
import com.deograce.subscriptionmanager.domain.model.Client
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

fun ClientEntity.toDomain(): Client = Client(
    id = id,
    name = name,
    phoneNumber = phoneNumber,
    subscriptionType = subscriptionType,
    startDate = Instant.ofEpochMilli(startDate).atZone(ZoneId.systemDefault()).toLocalDate(),
    durationDays = durationDays,
    expirationDate = Instant.ofEpochMilli(expirationDate).atZone(ZoneId.systemDefault()).toLocalDate(),
    price = price,
    notes = notes,
    isActive = isActive
)

fun Client.toEntity(): ClientEntity = ClientEntity(
    id = id,
    name = name,
    phoneNumber = phoneNumber,
    subscriptionType = subscriptionType,
    startDate = startDate.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli(),
    durationDays = durationDays,
    expirationDate = expirationDate.atStartOfDay(ZoneId.systemDefault()).toInstant().toEpochMilli(),
    price = price,
    notes = notes,
    isActive = isActive
)
