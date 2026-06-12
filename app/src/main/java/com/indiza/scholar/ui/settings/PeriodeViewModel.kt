package com.indiza.scholar.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.model.*
import com.indiza.scholar.network.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class PeriodeViewModel(private val api: ApiService) : ViewModel() {

    private val _periodes = MutableStateFlow<List<PeriodeEntity>>(emptyList())
    val periodes: StateFlow<List<PeriodeEntity>> = _periodes.asStateFlow()

    private val _saveState = MutableStateFlow<SaveState>(SaveState.IDLE)
    val saveState: StateFlow<SaveState> = _saveState.asStateFlow()

    fun loadPeriodes(idAnneeScolaire: Long) {
        viewModelScope.launch {
            try {
                val response = api.getPeriodesByAnnee(idAnneeScolaire)
                if (response.isSuccessful) {
                    _periodes.value = response.body() ?: emptyList()
                } else {
                    _saveState.value = SaveState.ERROR("Erreur de chargement: ${response.code()}")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR("Serveur injoignable")
            }
        }
    }

    fun savePeriode(periode: PeriodeEntity, idAnneeScolaire: Long) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                val response = if (periode.idServeur != null && periode.idServeur > 0) {
                    api.updatePeriode(periode.idServeur, periode)
                } else {
                    api.createPeriode(periode)
                }
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                    loadPeriodes(idAnneeScolaire)
                } else {
                    _saveState.value = SaveState.ERROR("Erreur: ${response.errorBody()?.string()}")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR(e.localizedMessage ?: "Erreur réseau")
            }
        }
    }

    fun deletePeriode(id: Long, idAnneeScolaire: Long) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                val response = api.deletePeriode(id)
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                    loadPeriodes(idAnneeScolaire)
                } else {
                    _saveState.value = SaveState.ERROR("Erreur suppression: ${response.code()}")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR("Erreur réseau")
            }
        }
    }

    fun saveSousPeriode(sp: SousPeriodeEntity, idAnneeScolaire: Long) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                val response = if (sp.idServeur != null && sp.idServeur > 0) {
                    api.updateSousPeriode(sp.idServeur, sp)
                } else {
                    api.createSousPeriode(sp)
                }
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                    loadPeriodes(idAnneeScolaire)
                } else {
                    _saveState.value = SaveState.ERROR("Erreur: ${response.code()}")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR(e.localizedMessage ?: "Erreur réseau")
            }
        }
    }

    fun deleteSousPeriode(id: Long, idAnneeScolaire: Long) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                val response = api.deleteSousPeriode(id)
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                    loadPeriodes(idAnneeScolaire)
                } else {
                    _saveState.value = SaveState.ERROR("Erreur suppression: ${response.code()}")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR("Erreur réseau")
            }
        }
    }

    fun resetSaveState() {
        _saveState.value = SaveState.IDLE
    }

    fun clonePeriodes(idSource: Long, idCible: Long) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                val response = api.clonePeriodes(mapOf("idAnneeSource" to idSource, "idAnneeCible" to idCible))
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                    loadPeriodes(idCible)
                } else {
                    _saveState.value = SaveState.ERROR("Erreur clonage")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR(e.localizedMessage ?: "Erreur réseau")
            }
        }
    }
}
