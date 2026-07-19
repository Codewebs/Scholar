package com.indiza.scholar.ui.discipline

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.model.*
import com.indiza.scholar.network.ApiService
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class DisciplineViewModel(private val api: ApiService) : ViewModel() {

    private val _salles = MutableStateFlow<List<SalleEntity>>(emptyList())
    val salles: StateFlow<List<SalleEntity>> = _salles

    private val _sequences = MutableStateFlow<List<SousPeriodeEntity>>(emptyList())
    val sequences: StateFlow<List<SousPeriodeEntity>> = _sequences

    private val _sequenceRepartition = MutableStateFlow<List<RepartitionSousPeriodeEntity>>(emptyList())
    val sequenceRepartition: StateFlow<List<RepartitionSousPeriodeEntity>> = _sequenceRepartition

    private val _absences = MutableStateFlow<List<AbsenceUiModel>>(emptyList())
    val absences: StateFlow<List<AbsenceUiModel>> = _absences

    private val _repartitions = MutableStateFlow<List<RepartitionMatiereEntity>>(emptyList())
    val repartitions: StateFlow<List<RepartitionMatiereEntity>> = _repartitions

    private val _repartitionCompetences = MutableStateFlow<List<RepartitionCompetenceEntity>>(emptyList())
    val repartitionCompetences: StateFlow<List<RepartitionCompetenceEntity>> = _repartitionCompetences

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _hasChanges = MutableStateFlow(false)
    val hasChanges: StateFlow<Boolean> = _hasChanges

    fun loadInitialData(idAnnee: Long) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val sRes = api.getSallesByAnnee(idAnnee)
                if (sRes.isSuccessful) _salles.value = sRes.body() ?: emptyList()
                
                val pRes = api.getPeriodesByAnnee(idAnnee)
                if (pRes.isSuccessful) {
                    _sequences.value = pRes.body()?.flatMap { it.sousPeriodes } ?: emptyList()
                }

                val srRes = api.getSequenceRepartition(idAnnee)
                if (srRes.isSuccessful) _sequenceRepartition.value = srRes.body() ?: emptyList()
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loadAbsences(idSalle: Long, idSequence: Long, idAnnee: Long, idRepComp: Long?) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = api.getAbsences(idSalle, idSequence, idAnnee, idRepComp)
                if (response.isSuccessful) {
                    _absences.value = response.body() ?: emptyList()
                    _hasChanges.value = false
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loadRepartitions(idAnnee: Long, idClasse: Long) {
        viewModelScope.launch {
            try {
                val res = api.getRepartitionByAnnee(idAnnee, idClasse, null)
                if (res.isSuccessful) _repartitions.value = res.body() ?: emptyList()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun loadCompetences(idRepMat: Long, idSequence: Long) {
        viewModelScope.launch {
            try {
                val res = api.getRepartitionCompetences(idRepMat, idSequence)
                if (res.isSuccessful) _repartitionCompetences.value = res.body() ?: emptyList()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun updateAbsenceLocally(index: Int, aj: Int, anj: Int) {
        val currentList = _absences.value.toMutableList()
        if (index in currentList.indices) {
            currentList[index] = currentList[index].copy(
                heuresAJ = aj, 
                heuresANJ = anj,
                isDirty = true
            )
            _absences.value = currentList
            _hasChanges.value = true
        }
    }

    fun saveAbsences(idSequence: Long, idAnnee: Long, idRepComp: Long?, onComplete: (Boolean) -> Unit) {
        viewModelScope.launch {
            try {
                val dirtyAbsences = _absences.value.filter { it.isDirty }
                android.util.Log.d("DisciplineViewModel", "🚀 Initializing save for ${dirtyAbsences.size} dirty records")
                
                if (dirtyAbsences.isEmpty()) {
                    android.util.Log.d("DisciplineViewModel", "ℹ️ No changes to save")
                    onComplete(true)
                    return@launch
                }

                val payload = SaveAbsencesPayload(
                    absences = dirtyAbsences,
                    idSequence = idSequence,
                    idAnneeScolaire = idAnnee,
                    idRepartitionCompetence = idRepComp
                )
                
                android.util.Log.d("DisciplineViewModel", "📤 Sending payload: idSeq=$idSequence, idAnnee=$idAnnee, idRepComp=$idRepComp")
                dirtyAbsences.forEach { 
                    android.util.Log.d("DisciplineViewModel", "   - Inscription: ${it.idInscription}, AJ: ${it.heuresAJ}, ANJ: ${it.heuresANJ}, Comp: ${it.idRepartitionCompetence}")
                }

                val res = api.saveAbsences(payload)
                if (res.isSuccessful) {
                    android.util.Log.d("DisciplineViewModel", "✅ Absences saved successfully")
                    _absences.value = _absences.value.map { it.copy(isDirty = false) }
                    _hasChanges.value = false
                    onComplete(true)
                } else {
                    android.util.Log.e("DisciplineViewModel", "❌ Save failed: ${res.code()} ${res.errorBody()?.string()}")
                    onComplete(false)
                }
            } catch (e: Exception) {
                android.util.Log.e("DisciplineViewModel", "💥 Error during save", e)
                e.printStackTrace()
                onComplete(false)
            }
        }
    }
}
