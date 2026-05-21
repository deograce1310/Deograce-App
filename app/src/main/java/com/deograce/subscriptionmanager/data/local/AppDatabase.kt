package com.deograce.subscriptionmanager.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.deograce.subscriptionmanager.data.local.dao.ClientDao
import com.deograce.subscriptionmanager.data.local.entity.ClientEntity

@Database(entities = [ClientEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {
    abstract fun clientDao(): ClientDao
}
