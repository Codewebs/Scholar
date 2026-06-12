package com.indiza.scholar.ui.personnel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.model.*
import com.indiza.scholar.repositories.PersonnelRepository
import com.indiza.scholar.ui.settings.SaveState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class PersonnelUIState {
    object Loading : PersonnelUIState()
    data class Success(val list: List<InscriptionPersonnelEntity>) : PersonnelUIState()
    data class Error(val message: String) : PersonnelUIState()
}

class PersonnelManagementViewModel(
    private val repo: PersonnelRepository,
    private val idEtablissement: Long,
    private val idAnnee: Long
) : ViewModel() {

    private val _uiState = MutableStateFlow<PersonnelUIState>(PersonnelUIState.Loading)
    val uiState: StateFlow<PersonnelUIState> = _uiState.asStateFlow()

    private val _demandes = MutableStateFlow<List<DemandeInscriptionPersonnel>>(emptyList())
    val demandes: StateFlow<List<DemandeInscriptionPersonnel>> = _demandes.asStateFlow()

    private val _availableMatieres = MutableStateFlow<List<MatiereEntity>>(emptyList())
    val availableMatieres: StateFlow<List<MatiereEntity>> = _availableMatieres.asStateFlow()

    private val _sallesDisponibles = MutableStateFlow<List<SalleEntity>>(emptyList())
    val sallesDisponibles: StateFlow<List<SalleEntity>> = _sallesDisponibles.asStateFlow()

    private val _enseignantsBySalle = MutableStateFlow<List<AffectationPersonnelSalleResponse>>(emptyList())
    val enseignantsBySalle: StateFlow<List<AffectationPersonnelSalleResponse>> = _enseignantsBySalle.asStateFlow()

    private val _affectationsMembre = MutableStateFlow<List<AffectationPersonnelSalleResponse>>(emptyList())
    val affectationsMembre: StateFlow<List<AffectationPersonnelSalleResponse>> = _affectationsMembre.asStateFlow()

    private val _isLoadingAffectations = MutableStateFlow(false)
    val isLoadingAffectations: StateFlow<Boolean> = _isLoadingAffectations.asStateFlow()

    init {
        loadPersonnel()
        loadDemandes()
        loadHistorique()
        loadMatieres()
    }

    fun loadSalles(idAnnee: Long) {
        viewModelScope.launch {
            try {
                val response = repo.getSalles(idAnnee)
                if (response.isSuccessful) {
                    _sallesDisponibles.value = response.body() ?: emptyList()
                }
            } catch (e: Exception) {}
        }
    }

    fun loadEnseignantsBySalle(idSalle: Long) {
        viewModelScope.launch {
            _isLoadingAffectations.value = true
            try {
                val response = repo.getEnseignantsBySalle(idSalle)
                if (response.isSuccessful) {
                    _enseignantsBySalle.value = response.body() ?: emptyList()
                }
            } catch (e: Exception) {
            } finally {
                _isLoadingAffectations.value = false
            }
        }
    }

    fun loadAffectationsMembre(idIns: Long) {
        viewModelScope.launch {
            try {
                val response = repo.getAffectationsByMembre(idIns)
                if (response.isSuccessful) {
                    _affectationsMembre.value = response.body() ?: emptyList()
                }
            } catch (e: Exception) {}
        }
    }

    fun affecterPersonnel(payload: AffectationPayload, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            try {
                val response = repo.affecterSalle(payload)
                onResult(response.isSuccessful)
                if (response.isSuccessful) loadPersonnel()
            } catch (e: Exception) {
                onResult(false)
            }
        }
    }

    fun retirerAffectation(id: Long) {
        viewModelScope.launch {
            try {
                val response = repo.retirerAffectation(id)
                if (response.isSuccessful) loadPersonnel()
            } catch (e: Exception) {}
        }
    }

    fun banirPersonnel(id: Long) {
        viewModelScope.launch {
            try {
                val response = repo.banir(id)
                if (response.isSuccessful) loadPersonnel()
            } catch (e: Exception) {}
        }
    }

    fun loadMatieres() {
        viewModelScope.launch {
            try {
                val response = repo.getMatieres()
                if (response.isSuccessful) {
                    _availableMatieres.value = response.body() ?: emptyList()
                }
            } catch (e: Exception) {}
        }
    }

    fun loadHistorique() {
        viewModelScope.launch {
            try {
                // Fetch all unique personnel ever registered in this school, filtered by 'not in current year'
                // This would need a specific endpoint like /personnel/historique/:idEtablissement/:idAnneeActuelle
            } catch (e: Exception) {}
        }
    }

    fun loadPersonnel() {
        viewModelScope.launch {
            _uiState.value = PersonnelUIState.Loading
            try {
                val response = repo.getPersonnelActif(idEtablissement, idAnnee)
                if (response.isSuccessful) {
                    _uiState.value = PersonnelUIState.Success(response.body() ?: emptyList())
                } else {
                    _uiState.value = PersonnelUIState.Error("Erreur serveur: ${response.code()}")
                }
            } catch (e: Exception) {
                _uiState.value = PersonnelUIState.Error(e.localizedMessage ?: "Erreur réseau")
            }
        }
    }

    fun loadDemandes() {
        viewModelScope.launch {
            try {
                val response = repo.getDemandesEnAttente(idEtablissement)
                if (response.isSuccessful) {
                    _demandes.value = response.body() ?: emptyList()
                }
            } catch (e: Exception) {}
        }
    }

    fun toggleBloque(personnel: InscriptionPersonnelEntity) {
        viewModelScope.launch {
            try {
                // Simplification: Invert current status
                val response = repo.setBloqueStatut(personnel.idServeur!!, idEtablissement, !personnel.bloque)
                if (response.isSuccessful) {
                    loadPersonnel()
                }
            } catch (e: Exception) {}
        }
    }

    fun reconduireMasse(ids: List<Long>, nextYearId: Long) {
        viewModelScope.launch {
            try {
                val response = repo.reconduirePersonnel(ids, nextYearId)
                if (response.isSuccessful) {
                    loadPersonnel()
                }
            } catch (e: Exception) {}
        }
    }

    fun validerDemande(payload: ValidationDemandePayload) {
        viewModelScope.launch {
            try {
                val response = repo.validerDemande(payload)
                if (response.isSuccessful) {
                    loadDemandes()
                    loadPersonnel()
                }
            } catch (e: Exception) {}
        }
    }

    fun updatePermissions(idIns: Long, added: List<String>, removed: List<String>) {
        viewModelScope.launch {
            try {
                val response = repo.updatePermissions(idIns, added, removed)
                if (response.isSuccessful) {
                    loadPersonnel()
                }
            } catch (e: Exception) {}
        }
    }
}
