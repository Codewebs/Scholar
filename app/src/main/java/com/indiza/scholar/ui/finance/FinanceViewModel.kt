package com.indiza.scholar.ui.finance

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.model.FraisStatItem
import com.indiza.scholar.model.PaiementPayload
import com.indiza.scholar.model.RecouvrementStatsResponse
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.settings.SaveState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class FinanceViewModel(private val api: ApiService) : ViewModel() {

    private val _recouvrementStats = MutableStateFlow<RecouvrementStatsResponse?>(null)
    val recouvrementStats: StateFlow<RecouvrementStatsResponse?> = _recouvrementStats.asStateFlow()

    private val _paymentState = MutableStateFlow<SaveState>(SaveState.IDLE)
    val paymentState: StateFlow<SaveState> = _paymentState.asStateFlow()

    private val _studentPaymentDetails = MutableStateFlow<com.indiza.scholar.model.StudentPaymentDetails?>(null)
    val studentPaymentDetails: StateFlow<com.indiza.scholar.model.StudentPaymentDetails?> = _studentPaymentDetails.asStateFlow()

    fun loadRecouvrementStats(idClasse: Long, idAnneeScolaire: Long) {
        viewModelScope.launch {
            try {
                val response = api.getRecouvrementStats(idClasse, idAnneeScolaire)
                if (response.isSuccessful) {
                    _recouvrementStats.value = response.body()
                }
            } catch (e: Exception) {}
        }
    }

    fun loadStudentPaymentDetails(idEleve: Long, idAnneeScolaire: Long) {
        viewModelScope.launch {
            try {
                val response = api.getStudentPaymentDetails(idEleve, idAnneeScolaire)
                if (response.isSuccessful) {
                    _studentPaymentDetails.value = response.body()
                }
            } catch (e: Exception) {}
        }
    }

    fun effectuerPaiement(payload: PaiementPayload) {
        viewModelScope.launch {
            _paymentState.value = SaveState.SAVING_REMOTE
            try {
                val response = api.payerFraisExigibles(payload)
                if (response.isSuccessful) {
                    _paymentState.value = SaveState.SUCCESS
                    // Refresh details after payment
                    loadStudentPaymentDetails(payload.idEleve, payload.idAnneeScolaire)
                } else {
                    _paymentState.value = SaveState.ERROR("Erreur: ${response.code()}")
                }
            } catch (e: Exception) {
                _paymentState.value = SaveState.ERROR(e.localizedMessage ?: "Erreur réseau")
            }
        }
    }

    fun resetPaymentState() {
        _paymentState.value = SaveState.IDLE
    }
}
