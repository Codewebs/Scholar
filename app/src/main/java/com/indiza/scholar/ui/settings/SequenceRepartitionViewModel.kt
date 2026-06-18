package com.indiza.scholar.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.model.*
import com.indiza.scholar.network.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SequenceRepartitionViewModel(private val api: ApiService) : ViewModel() {

    private val _classes = MutableStateFlow<List<ClasseUiModel>>(emptyList())
    val classes = _classes.asStateFlow()

    private val _sequences = MutableStateFlow<List<SousPeriodeEntity>>(emptyList())
    val sequences = _sequences.asStateFlow()

    private val _repartition = MutableStateFlow<List<RepartitionSousPeriodeEntity>>(emptyList())
    val repartition = _repartition.asStateFlow()

    private val _loading = MutableStateFlow(false)
    val loading = _loading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error = _error.asStateFlow()

    fun loadData(yearId: Long) {
        viewModelScope.launch {
            _loading.value = true
            try {
                val roomsRes = api.getClassesWithRoomStats(yearId)
                val periodsRes = api.getPeriodesByAnnee(yearId)
                val repartitionRes = api.getSequenceRepartition(yearId)

                if (roomsRes.isSuccessful) {
                    _classes.value = roomsRes.body() ?: emptyList()
                }
                if (periodsRes.isSuccessful) {
                    val allSeqs = mutableListOf<SousPeriodeEntity>()
                    periodsRes.body()?.forEach { p ->
                        allSeqs.addAll(p.sousPeriodes)
                    }
                    _sequences.value = allSeqs
                }
                if (repartitionRes.isSuccessful) {
                    _repartition.value = repartitionRes.body() ?: emptyList()
                }
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _loading.value = false
            }
        }
    }

    fun bulkAssign(yearId: Long, classIds: List<Long>, sequenceIds: List<Long>, onComplete: () -> Unit) {
        viewModelScope.launch {
            _loading.value = true
            try {
                val res = api.bulkAssignSequences(SequenceRepartitionPayload(yearId, classIds, sequenceIds))
                if (res.isSuccessful) {
                    loadData(yearId)
                    onComplete()
                } else {
                    _error.value = "Échec de l'enregistrement"
                }
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _loading.value = false
            }
        }
    }
}
