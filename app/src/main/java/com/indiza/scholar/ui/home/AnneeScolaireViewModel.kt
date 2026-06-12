package com.indiza.scholar.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.model.AnneeScolaireEntity
import com.indiza.scholar.repositories.AnneeScolaireRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow

sealed class SyncState {
    object IDLE : SyncState()
    object SYNCING : SyncState()
    object CONNECTED : SyncState()
    object OFFLINE : SyncState()
    data class ERROR(val message: String) : SyncState()
}

class AnneeScolaireViewModel(
    private val repository: AnneeScolaireRepository,
    private val api: com.indiza.scholar.network.ApiService
) : ViewModel() {

    private val _annees = MutableStateFlow<List<AnneeScolaireEntity>>(emptyList())
    val annees: StateFlow<List<AnneeScolaireEntity>> = _annees.asStateFlow()

    private val _selectedAnnee = MutableStateFlow<AnneeScolaireEntity?>(null)
    val selectedAnnee: StateFlow<AnneeScolaireEntity?> = _selectedAnnee.asStateFlow()

    private val _syncState = MutableStateFlow<SyncState>(SyncState.IDLE)
    val syncState: StateFlow<SyncState> = _syncState.asStateFlow()

    private val _syncEvents = MutableSharedFlow<String>()
    val syncEvents: SharedFlow<String> = _syncEvents.asSharedFlow()

    fun fetchAnnees(schoolId: Long, userRole: String, selectedId: Long = 0L) = viewModelScope.launch {
        if (schoolId <= 0) return@launch
        
        _syncState.value = SyncState.SYNCING
        try {
            // Priority: Remote (Remote-First)
            val response = api.getYearsBySchool(schoolId)
            if (response.isSuccessful) {
                _syncState.value = SyncState.CONNECTED
                val allYears = response.body() ?: emptyList()
                
                // Filtrage selon les droits
                val role = com.indiza.scholar.model.AcademicRole.fromName(userRole)
                val canSeeAll = role.permissions.contains(com.indiza.scholar.model.AcademicPermission.COLLECT_ALL_SCHOOL_YEARS_INFO)
                
                val filtered = if (canSeeAll) allYears else allYears.filter { !it.cloturerAnnee }
                _annees.value = filtered

                // Sélection par défaut
                if (filtered.isNotEmpty()) {
                    val toSelect = filtered.find { it.idServeur == selectedId } 
                                 ?: filtered.find { !it.cloturerAnnee }
                                 ?: filtered.first()
                    _selectedAnnee.value = toSelect
                }
            } else {
                _syncState.value = SyncState.OFFLINE
                _syncEvents.emit("⚠️ Serveur inaccessible (Code ${response.code()})")
            }
        } catch (e: Exception) {
            _syncState.value = SyncState.OFFLINE
            _syncEvents.emit("🔌 Mode hors-ligne activé.")
        }
    }

    fun selectAnnee(annee: AnneeScolaireEntity) {
        _selectedAnnee.value = annee
    }

    fun addAnnee(annee: AnneeScolaireEntity, schoolId: Long, userRole: String) = viewModelScope.launch {
        try {
            val response = api.createAnnee(annee)
            if (response.isSuccessful) {
                _syncEvents.emit("✅ Année scolaire créée sur le serveur.")
                fetchAnnees(schoolId, userRole, response.body()?.idServeur ?: 0L)
            } else {
                _syncEvents.emit("❌ Échec de la création distante.")
            }
        } catch (e: Exception) {
            _syncEvents.emit("⚠️ Erreur réseau : Impossible de créer l'année.")
        }
    }

    fun updateAnnee(annee: AnneeScolaireEntity, schoolId: Long, userRole: String) = viewModelScope.launch {
        val id = annee.idServeur ?: return@launch
        try {
            val response = api.updateAnnee(id, annee)
            if (response.isSuccessful) {
                _syncEvents.emit("✅ Année mise à jour sur le serveur.")
                fetchAnnees(schoolId, userRole, id)
            } else {
                _syncEvents.emit("❌ Échec de la mise à jour distante.")
            }
        } catch (e: Exception) {
            _syncEvents.emit("⚠️ Erreur réseau.")
        }
    }

    fun deleteAnnee(annee: AnneeScolaireEntity, schoolId: Long, userRole: String) = viewModelScope.launch {
        val id = annee.idServeur ?: return@launch
        try {
            val response = api.deleteAnnee(id)
            if (response.isSuccessful) {
                _syncEvents.emit("✅ Année scolaire supprimée.")
                fetchAnnees(schoolId, userRole)
            } else {
                _syncEvents.emit("⚠️ Erreur lors de la suppression distante.")
            }
        } catch (e: Exception) {
            _syncEvents.emit("⚠️ Erreur réseau.")
        }
    }
}
