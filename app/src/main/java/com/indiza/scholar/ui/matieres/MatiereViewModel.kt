package com.indiza.scholar.ui.matieres

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.model.*
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.settings.SaveState
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class MatiereUIState {
    object Loading : MatiereUIState()
    data class Success(val list: List<MatiereEntity>) : MatiereUIState()
    data class Error(val message: String) : MatiereUIState()
}

class MatiereViewModel(private val api: ApiService) : ViewModel() {

    fun getApiService(): ApiService = api

    private val _uiState = MutableStateFlow<MatiereUIState>(MatiereUIState.Loading)
    val uiState: StateFlow<MatiereUIState> = _uiState.asStateFlow()

    private val _kpis = MutableStateFlow<MatiereKPIs?>(null)
    val kpis: StateFlow<MatiereKPIs?> = _kpis.asStateFlow()

    private val _repartitionStats = MutableStateFlow<List<ClassMatiereStat>>(emptyList())
    val repartitionStats: StateFlow<List<ClassMatiereStat>> = _repartitionStats.asStateFlow()

    private val _saveState = MutableStateFlow<SaveState>(SaveState.IDLE)
    val saveState: StateFlow<SaveState> = _saveState.asStateFlow()

    fun loadGlobalLibrary() {
        viewModelScope.launch {
            _uiState.value = MatiereUIState.Loading
            try {
                val response = api.getMatieres()
                if (response.isSuccessful) {
                    _uiState.value = MatiereUIState.Success(response.body() ?: emptyList())
                } else {
                    _uiState.value = MatiereUIState.Error("Erreur: ${response.code()}")
                }
            } catch (e: Exception) {
                _uiState.value = MatiereUIState.Error(e.localizedMessage ?: "Erreur réseau")
            }
        }
    }

    fun loadKPIs(idAnneeScolaire: Long) {
        viewModelScope.launch {
            try {
                val response = api.getMatiereKPIs(idAnneeScolaire)
                if (response.isSuccessful) _kpis.value = response.body()
            } catch (e: Exception) {}
        }
    }

    fun loadRepartitionStats(idAnneeScolaire: Long) {
        viewModelScope.launch {
            try {
                val response = api.getRepartitionStatsByClass(idAnneeScolaire)
                if (response.isSuccessful) _repartitionStats.value = response.body() ?: emptyList()
            } catch (e: Exception) {}
        }
    }

    fun createMatiere(libFr: String, libEn: String?, abreviation: String?) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                val matiere = MatiereEntity(
                    libelleFr = libFr, 
                    libelleEn = libEn, 
                    libelleEs = null,
                    abreviation = abreviation
                )
                val response = api.createMatiere(matiere)
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                    loadGlobalLibrary()
                } else {
                    _saveState.value = SaveState.ERROR("Erreur: ${response.code()}")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR(e.localizedMessage ?: "Erreur réseau")
            }
        }
    }

    fun resetSaveState() {
        _saveState.value = SaveState.IDLE
    }

    fun deleteMatiere(id: Long) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                val response = api.deleteMatiere(id)
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                    loadGlobalLibrary()
                } else {
                    _saveState.value = SaveState.ERROR("Erreur suppression: ${response.code()}")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR("Erreur réseau")
            }
        }
    }

    fun updateMatiere(id: Long, libFr: String, libEn: String?, abreviation: String?) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                val matiere = MatiereEntity(libelleFr = libFr, libelleEn = libEn, libelleEs = null, abreviation = abreviation)
                val response = api.updateMatiere(id, matiere)
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                    loadGlobalLibrary()
                } else {
                    _saveState.value = SaveState.ERROR("Erreur: ${response.code()}")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR("Erreur réseau")
            }
        }
    }

    // --- Répartition ---
    private val _repartition = MutableStateFlow<List<RepartitionMatiereEntity>>(emptyList())
    val repartition: StateFlow<List<RepartitionMatiereEntity>> = _repartition.asStateFlow()

    fun loadRepartition(idAnneeScolaire: Long, idClasse: Long? = null) {
        viewModelScope.launch {
            try {
                val response = api.getRepartitionByAnnee(idAnneeScolaire, idClasse)
                if (response.isSuccessful) _repartition.value = response.body() ?: emptyList()
            } catch (e: Exception) {}
        }
    }

    fun cloneProgram(payload: CloneProgramPayload, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                val response = api.cloneClassProgram(payload)
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                    onSuccess()
                } else {
                    _saveState.value = SaveState.ERROR("Erreur clonage")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR(e.localizedMessage ?: "Erreur réseau")
            }
        }
    }

    fun bulkAssignSubject(payload: BulkAssignSubjectPayload, onSuccess: () -> Unit) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                val response = api.bulkAssignSubject(payload)
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                    onSuccess()
                } else {
                    _saveState.value = SaveState.ERROR("Erreur affectation")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR(e.localizedMessage ?: "Erreur réseau")
            }
        }
    }

    // --- APC & Groups ---
    private val _groups = MutableStateFlow<List<GroupeMatiereEntity>>(emptyList())
    val groups: StateFlow<List<GroupeMatiereEntity>> = _groups.asStateFlow()

    private val _competences = MutableStateFlow<List<CompetenceEntity>>(emptyList())
    val competences: StateFlow<List<CompetenceEntity>> = _competences.asStateFlow()

    private val _repartitionCompetences = MutableStateFlow<List<RepartitionCompetenceEntity>>(emptyList())
    val repartitionCompetences: StateFlow<List<RepartitionCompetenceEntity>> = _repartitionCompetences.asStateFlow()

    fun loadGroups() {
        viewModelScope.launch {
            try {
                val response = api.getMatiereGroups()
                if (response.isSuccessful) _groups.value = response.body() ?: emptyList()
            } catch (e: Exception) {}
        }
    }

    fun createGroup(libFr: String, ordre: Int = 1) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                val group = GroupeMatiereEntity(libelleFr = libFr, libelleEn = null, libelleEs = null, ordre = ordre)
                val response = api.createGroup(group)
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                    loadGroups()
                } else {
                    _saveState.value = SaveState.ERROR("Erreur: ${response.code()}")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR("Erreur réseau")
            }
        }
    }

    fun updateGroup(id: Long, libFr: String, ordre: Int) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                val group = GroupeMatiereEntity(libelleFr = libFr, libelleEn = null, libelleEs = null, ordre = ordre)
                val response = api.updateGroup(id, group)
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                    loadGroups()
                } else {
                    _saveState.value = SaveState.ERROR("Erreur: ${response.code()}")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR("Erreur réseau")
            }
        }
    }

    fun deleteGroup(id: Long) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                val response = api.deleteGroup(id)
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                    loadGroups()
                } else {
                    _saveState.value = SaveState.ERROR("Erreur: ${response.code()}")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR("Erreur réseau")
            }
        }
    }

    fun loadGlobalCompetencies() {
        viewModelScope.launch {
            try {
                val response = api.getGlobalCompetencies()
                if (response.isSuccessful) _competences.value = response.body() ?: emptyList()
            } catch (e: Exception) {}
        }
    }

    fun loadRepartitionCompetences(idRepartitionMatiere: Long?, idSousPeriode: Long?) {
        viewModelScope.launch {
            try {
                val response = api.getRepartitionCompetences(idRepartitionMatiere, idSousPeriode)
                if (response.isSuccessful) _repartitionCompetences.value = response.body() ?: emptyList()
            } catch (e: Exception) {}
        }
    }

    fun saveRepartitionCompetence(idRM: Long, idComp: Long, idSPs: List<Long>) {
        viewModelScope.launch {
            _saveState.value = SaveState.SAVING_REMOTE
            try {
                val payload = SaveRepartitionCompetencePayload(idRM, idComp, idSPs)
                val response = api.saveRepartitionCompetence(payload)
                if (response.isSuccessful) {
                    _saveState.value = SaveState.SUCCESS
                } else {
                    _saveState.value = SaveState.ERROR("Erreur: ${response.code()}")
                }
            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR("Erreur réseau")
            }
        }
    }

    fun deleteRepartitionCompetence(id: Long, idRM: Long, idSP: Long) {
        viewModelScope.launch {
            try {
                val response = api.deleteRepartitionCompetence(id)
                if (response.isSuccessful) loadRepartitionCompetences(idRM, idSP)
            } catch (e: Exception) {}
        }
    }
}
