package com.deograce.subscriptionmanager.ui.screens.clientform

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
import java.time.LocalDate
import javax.inject.Inject

@HiltViewModel
class ClientFormViewModel @Inject constructor(
    private val repository: ClientRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ClientFormUiState())
    val uiState: StateFlow<ClientFormUiState> = _uiState

    fun loadClient(id: Long) {
        viewModelScope.launch {
            repository.getClientById(id)?.let { entity ->
                val client = entity.toDomain()
                _uiState.value = ClientFormUiState(
                    editingId = client.id,
                    name = client.name,
                    phoneNumber = client.phoneNumber,
                    subscriptionType = client.subscriptionType,
                    startDate = client.startDate,
                    durationDays = client.durationDays.toString(),
                    expirationDate = client.expirationDate,
                    price = client.price.toString(),
                    notes = client.notes
                )
            }
        }
    }

    fun updateName(v: String) { _uiState.value = _uiState.value.copy(name = v) }
    fun updatePhone(v: String) { _uiState.value = _uiState.value.copy(phoneNumber = v) }
    fun updateSubscriptionType(v: String) { _uiState.value = _uiState.value.copy(subscriptionType = v) }
    fun updateStartDate(v: LocalDate) {
        val dur = _uiState.value.durationDays.toIntOrNull() ?: 30
        _uiState.value = _uiState.value.copy(startDate = v, expirationDate = v.plusDays(dur.toLong()))
    }
    fun updateDurationDays(v: String) {
        val dur = v.toIntOrNull() ?: 0
        val expiry = _uiState.value.startDate.plusDays(dur.toLong())
        _uiState.value = _uiState.value.copy(durationDays = v, expirationDate = expiry)
    }
    fun updateExpirationDate(v: LocalDate) { _uiState.value = _uiState.value.copy(expirationDate = v) }
    fun updatePrice(v: String) { _uiState.value = _uiState.value.copy(price = v) }
    fun updateNotes(v: String) { _uiState.value = _uiState.value.copy(notes = v) }

    fun save(onSuccess: () -> Unit) {
        val state = _uiState.value
        if (state.name.isBlank() || state.subscriptionType.isBlank()) {
            _uiState.value = state.copy(error = "Nom et type d'abonnement requis")
            return
        }
        viewModelScope.launch {
            val client = Client(
                id = state.editingId ?: 0,
                name = state.name.trim(),
                phoneNumber = state.phoneNumber.trim(),
                subscriptionType = state.subscriptionType.trim(),
                startDate = state.startDate,
                durationDays = state.durationDays.toIntOrNull() ?: 30,
                expirationDate = state.expirationDate,
                price = state.price.toDoubleOrNull() ?: 0.0,
                notes = state.notes.trim()
            )
            repository.saveClient(client.toEntity())
            onSuccess()
        }
    }
}

data class ClientFormUiState(
    val editingId: Long? = null,
    val name: String = "",
    val phoneNumber: String = "",
    val subscriptionType: String = "",
    val startDate: LocalDate = LocalDate.now(),
    val durationDays: String = "30",
    val expirationDate: LocalDate = LocalDate.now().plusDays(30),
    val price: String = "",
    val notes: String = "",
    val error: String? = null
)
