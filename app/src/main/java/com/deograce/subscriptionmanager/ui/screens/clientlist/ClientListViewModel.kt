package com.deograce.subscriptionmanager.ui.screens.clientlist

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.deograce.subscriptionmanager.data.repository.ClientRepository
import com.deograce.subscriptionmanager.domain.mapper.toDomain
import com.deograce.subscriptionmanager.domain.model.Client
import com.deograce.subscriptionmanager.notification.NotificationScheduler
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ClientListViewModel @Inject constructor(
    private val repository: ClientRepository,
    private val scheduler: NotificationScheduler
) : ViewModel() {

    val clients = repository.getAllClients()
        .map { list -> list.map { it.toDomain() } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        scheduler.scheduleDailyCheck()
    }

    fun deleteClient(client: Client) {
        viewModelScope.launch { repository.deleteClient(client.id) }
    }
}
