package com.indiza.scholar.ui.home

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.model.SetupProgressResponse
import com.indiza.scholar.network.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class HomeViewModel(private val api: ApiService) : ViewModel() {

    private val _setupProgress = MutableStateFlow<SetupProgressResponse?>(null)
    val setupProgress: StateFlow<SetupProgressResponse?> = _setupProgress.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    fun loadSetupProgress(schoolId: Long, yearId: Long?) {
        viewModelScope.launch {
            _error.value = null
            try {
                Log.d("HomeViewModel", "Loading setup progress for school $schoolId, year $yearId")
                val response = api.getSetupProgress(schoolId, yearId)
                if (response.isSuccessful) {
                    _setupProgress.value = response.body()
                    Log.d("HomeViewModel", "Setup progress loaded: ${response.body()}")
                } else {
                    val errorMsg = "Erreur serveur: ${response.code()}"
                    Log.e("HomeViewModel", "Failed to load setup progress: ${response.errorBody()?.string()}")
                    _error.value = errorMsg
                }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "Error loading setup progress", e)
                _error.value = when (e) {
                    is java.net.SocketTimeoutException -> "Délai d'attente dépassé. Serveur injoignable."
                    is java.net.UnknownHostException -> "Hôte inconnu. Vérifiez l'adresse IP."
                    is java.net.ConnectException -> "Connexion refusée. Le serveur est-il lancé ?"
                    else -> "Erreur de connexion : ${e.message}"
                }
            }
        }
    }

    fun syncPermissions(userId: Long, schoolId: Long, yearId: Long) {
        viewModelScope.launch {
            try {
                val response = api.getUserAssociations(userId)
                if (response.isSuccessful) {
                    val associations = response.body() ?: emptyList()
                    val currentAssoc = associations.find { 
                        it.school.idServeur == schoolId && (it.idAnneeScolaire == yearId || it.idAnneeScolaire == 0L)
                    }
                    
                    currentAssoc?.let {
                        Log.d("HomeViewModel", "🔄 Context updated: Role=${it.roles.firstOrNull()}, Added=${it.permissionsAjoutees.size}, Removed=${it.permissionsRetirees.size}")
                        // Mettre à jour le SessionManager
                        com.indiza.scholar.SessionManager.setContext(
                            schoolId = schoolId,
                            yearId = yearId,
                            active = true,
                            role = it.roles.firstOrNull()
                        )
                        com.indiza.scholar.SessionManager.updatePermissions(
                            added = it.permissionsAjoutees,
                            removed = it.permissionsRetirees
                        )
                    }
                }
            } catch (e: Exception) {
                Log.e("HomeViewModel", "❌ Sync Permissions failed", e)
            }
        }
    }
}

class HomeViewModelFactory(private val api: ApiService) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(HomeViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return HomeViewModel(api) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
