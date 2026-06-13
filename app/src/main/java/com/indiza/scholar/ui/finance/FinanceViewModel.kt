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

    private val _lastPaymentId = MutableStateFlow<Long?>(null)
    val lastPaymentId: StateFlow<Long?> = _lastPaymentId.asStateFlow()

    private val _studentPaymentDetails = MutableStateFlow<com.indiza.scholar.model.StudentPaymentDetails?>(null)
    val studentPaymentDetails: StateFlow<com.indiza.scholar.model.StudentPaymentDetails?> = _studentPaymentDetails.asStateFlow()

    private val _paymentType = MutableStateFlow("EXIGIBLE")
    val paymentType: StateFlow<String> = _paymentType.asStateFlow()

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
        _paymentType.value = "EXIGIBLE"
        viewModelScope.launch {
            try {
                val response = api.getStudentPaymentDetails(idEleve, idAnneeScolaire)
                if (response.isSuccessful) {
                    _studentPaymentDetails.value = response.body()
                }
            } catch (e: Exception) {}
        }
    }

    fun loadStudentPeriscolaireDetails(idEleve: Long, idAnneeScolaire: Long) {
        _paymentType.value = "PERISCOLAIRE"
        viewModelScope.launch {
            try {
                val response = api.getStudentPeriscolaireDetails(idEleve, idAnneeScolaire)
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
                val response = if (_paymentType.value == "EXIGIBLE") api.payerFraisExigibles(payload)
                               else api.payerFraisPeriscolaires(payload)
                
                if (response.isSuccessful) {
                    val body = response.body() as? Map<*, *>
                    _lastPaymentId.value = (body?.get("idPaiement") as? Double)?.toLong() 
                        ?: (body?.get("idPaiement") as? Int)?.toLong()

                    _paymentState.value = SaveState.SUCCESS
                    // Refresh details after payment
                    if (_paymentType.value == "EXIGIBLE") loadStudentPaymentDetails(payload.idEleve, payload.idAnneeScolaire)
                    else loadStudentPeriscolaireDetails(payload.idEleve, payload.idAnneeScolaire)
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
