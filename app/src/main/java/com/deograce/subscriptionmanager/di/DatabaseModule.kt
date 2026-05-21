package com.deograce.subscriptionmanager.di

import android.content.Context
import androidx.room.Room
import com.deograce.subscriptionmanager.data.local.AppDatabase
import com.deograce.subscriptionmanager.data.local.dao.ClientDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, "deograce_db").build()

    @Provides
    fun provideClientDao(db: AppDatabase): ClientDao = db.clientDao()
}
