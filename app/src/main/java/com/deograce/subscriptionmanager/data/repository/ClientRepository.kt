package com.deograce.subscriptionmanager.data.repository

import com.deograce.subscriptionmanager.data.local.dao.ClientDao
import com.deograce.subscriptionmanager.data.local.entity.ClientEntity
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ClientRepository @Inject constructor(private val dao: ClientDao) {

    fun getAllClients(): Flow<List<ClientEntity>> = dao.getAllClients()

    suspend fun getClientById(id: Long): ClientEntity? = dao.getClientById(id)

    suspend fun saveClient(client: ClientEntity): Long = dao.insertClient(client)

    suspend fun updateClient(client: ClientEntity) = dao.updateClient(client)

    suspend fun deleteClient(id: Long) = dao.deleteClientById(id)

    suspend fun getClientsExpiringBetween(from: Long, to: Long): List<ClientEntity> =
        dao.getClientsExpiringBetween(from, to)
}
