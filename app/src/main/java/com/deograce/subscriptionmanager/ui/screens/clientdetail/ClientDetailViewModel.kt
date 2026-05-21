package com.deograce.subscriptionmanager.ui.screens.clientdetail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.deograce.subscriptionmanager.data.repository.ClientRepository
import com.deograce.subscriptionmanager.domain.mapper.toDomain
import com.deograce.subscriptionmanager.domain.mapper.toEntity
import com.deograce.subscriptionmanager.domain.model.Client
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ClientDetailViewModel @Inject constructor(
    private val repository: ClientRepository
) : ViewModel() {

    private val _client = MutableStateFlow<Client?>(null)
    val client: StateFlow<Client?> = _client

    fun loadClient(id: Long) {
        viewModelScope.launch {
            _client.value = repository.getClientById(id)?.toDomain()
        }
    }

    fun renewSubscription(client: Client, newExpirationDate: java.time.LocalDate) {
        viewModelScope.launch {
            val updated = client.copy(
                startDate = java.time.LocalDate.now(),
                expirationDate = newExpirationDate,
                durationDays = java.time.LocalDate.now()
                    .until(newExpirationDate, java.time.temporal.ChronoUnit.DAYS).toInt(),
                isActive = true
            )
            repository.updateClient(updated.toEntity())
            _client.value = updated
        }
    }
}
