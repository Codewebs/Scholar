package com.indiza.scholar.ui.Etablissement

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.model.EtablissementEntity
import com.indiza.scholar.repositories.EtablissementRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class EtablissementViewModel(private val repository: EtablissementRepository) : ViewModel() {

    val etablissement = repository.etablissement.stateIn(
        scope = viewModelScope,
        started = SharingStarted.WhileSubscribed(5000),
        initialValue = null
    )

    private val _uploading = MutableStateFlow(false)
    val uploading: StateFlow<Boolean> = _uploading.asStateFlow()

    private val _userSchools = MutableStateFlow<List<EtablissementEntity>>(emptyList())
    val userSchools: StateFlow<List<EtablissementEntity>> = _userSchools.asStateFlow()

    fun loadUserSchools(userId: Long) {
        viewModelScope.launch {
            try {
                val response = repository.getUserSchools(userId)
                if (response.isSuccessful) {
                    _userSchools.value = response.body() ?: emptyList()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun updateEtablissement(updated: EtablissementEntity) {
        viewModelScope.launch {
            repository.updateLocal(updated)
            // Synchronisation immédiate avec le serveur
            repository.syncEtablissement(updated)
        }
    }

    fun loadSchool(schoolId: Long) {
        viewModelScope.launch {
            repository.fetchAndSaveSchool(schoolId)
        }
    }

    fun uploadLogo(uri: Uri, context: android.content.Context, onResult: (String?) -> Unit) {
        viewModelScope.launch {
            _uploading.value = true
            val filename = repository.uploadLogo(uri, context)
            _uploading.value = false
            onResult(filename)
        }
    }
}