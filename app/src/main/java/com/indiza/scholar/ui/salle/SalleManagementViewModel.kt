package com.indiza.scholar.ui.salle

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.model.ClasseUiModel
import com.indiza.scholar.model.SalleEntity
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.settings.SaveState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SalleManagementViewModel(private val api: ApiService) : ViewModel() {
    private val _classes = MutableStateFlow<List<ClasseUiModel>>(emptyList())
    val classes: StateFlow<List<ClasseUiModel>> = _classes.asStateFlow()

    private val _saveState = MutableStateFlow<SaveState>(SaveState.IDLE)
    val saveState: StateFlow<SaveState> = _saveState.asStateFlow()

    fun loadClassesWithStats(idAnneeScolaire: Long) {
        viewModelScope.launch {
            try {
                val response = api.getClassesWithRoomStats(idAnneeScolaire)
                if (response.isSuccessful) {
                    _classes.value = response.body() ?: emptyList()
                }
            } catch (e: Exception) {}
        }
    }

    fun createSalle(salle: SalleEntity, idAnneeScolaire: Long) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                // S'assurer que l'idAnneeScolaire est présent dans l'objet salle si passé en paramètre
                val finalSalle = if (salle.idAnneeScolaire == null && idAnneeScolaire > 0) {
                    salle.copy(idAnneeScolaire = idAnneeScolaire)
                } else salle

                val response = api.createSalle(finalSalle)
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                    if (idAnneeScolaire > 0) loadClassesWithStats(idAnneeScolaire)
                } else {
                    _saveState.value = SaveState.ERROR("Erreur serveur: ${response.code()}")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR(e.localizedMessage ?: "Erreur réseau")
            }
        }
    }

    fun resetSaveState() {
        _saveState.value = SaveState.IDLE
    }
}
