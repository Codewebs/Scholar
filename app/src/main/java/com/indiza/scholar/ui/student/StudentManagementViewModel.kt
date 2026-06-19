package com.indiza.scholar.ui.student

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.model.AcademicPermission
import com.indiza.scholar.model.AcademicRole
import com.indiza.scholar.model.ReceiptData
import com.indiza.scholar.model.StudentRegistrationPayload
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.settings.SaveState

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class StudentUIState {
    object Loading : StudentUIState()
    data class Success(val listEleves: List<EleveUiModel>) : StudentUIState()
    data class Error(val message: String) : StudentUIState()
}

data class EleveUiModel(
    val idEleve: Long,
    val idInscription: Long = 0L,
    val matricule: String,
    val nom: String? = null,
    val prenom: String? = null,
    val nomComplet: String,
    val idClasse: Long, 
    val classeLabel: String,
    val idSalle: Long = 0L,
    val salleLabel: String? = null,
    val sexe: String,
    val statutInscription: String,
    val dateNaissance: String? = null,
    val lieuNaissance: String? = null,
    val quartier: String? = null,
    val dateInscription: String? = null,
    val isSolded: Boolean = false,
    val hasAnyPayment: Boolean = false,
    val hasGrades: Boolean = false,
    var matiereNotees: Int = 0,
    var totalMatieres: Int = 0,
    val nomPere: String? = null,
    val telephonePere: Long? = null,
    val nomMere: String? = null,
    val telephoneMere: Long? = null,
    val nomTuteur: String? = null,
    val telephoneTuteur: Long? = null,
    val ancienEtablissement: String? = null
)

class StudentManagementViewModel(
    private val api: ApiService,
    private val userRole: AcademicRole
) : ViewModel() {

    private val _uiState = MutableStateFlow<StudentUIState>(StudentUIState.Loading)
    val uiState: StateFlow<StudentUIState> = _uiState.asStateFlow()

    private val _registrationState = MutableStateFlow<SaveState>(SaveState.IDLE)
    val registrationState: StateFlow<SaveState> = _registrationState.asStateFlow()

    private val _syncEvents = MutableSharedFlow<String>()
    val syncEvents: SharedFlow<String> = _syncEvents.asSharedFlow()

    // Vérification rapide des droits dans l'UI
    val canEnrollStudents: Boolean = userRole.permissions.contains(AcademicPermission.ENROLL_STUDENT)

    private val _sallesDisponibles = MutableStateFlow<List<com.indiza.scholar.model.SalleEntity>>(emptyList())
    val sallesDisponibles: StateFlow<List<com.indiza.scholar.model.SalleEntity>> = _sallesDisponibles.asStateFlow()

    private val _hasClasses = MutableStateFlow<Boolean>(true)
    val hasClasses: StateFlow<Boolean> = _hasClasses.asStateFlow()

    fun chargerSallesParAnnee(idAnneeScolaire: Long) {
        if (idAnneeScolaire <= 0L) return
        viewModelScope.launch(Dispatchers.IO) {
            try {
                // On vérifie d'abord si des classes existent via les stats
                val classStats = api.getClassesWithRoomStats(idAnneeScolaire)
                if (classStats.isSuccessful) {
                    _hasClasses.value = classStats.body()?.isNotEmpty() ?: false
                }

                val response = api.getSallesByAnnee(idAnneeScolaire)
                if (response.isSuccessful) {
                    _sallesDisponibles.value = response.body() ?: emptyList()
                }
            } catch (e: Exception) { /* Log error */ }
        }
    }

    fun chargerElevesParSalle(idAnneeScolaire: Long, idSalle: Long) {
        if (idAnneeScolaire <= 0L) {
            _uiState.value = StudentUIState.Success(emptyList())
            return
        }

        viewModelScope.launch(Dispatchers.IO) {
            _uiState.value = StudentUIState.Loading
            try {
                val response = if (idSalle > 0L) {
                    api.getStudentsByRoom(idAnneeScolaire, idSalle)
                } else {
                    api.getAllStudents(idAnneeScolaire)
                }

                if (response.isSuccessful) {
                    _uiState.value = StudentUIState.Success(response.body() ?: emptyList())
                } else {
                    _uiState.value = StudentUIState.Error("Erreur serveur : ${response.code()}")
                }
            } catch (e: Exception) {
                _uiState.value = StudentUIState.Error("Erreur de chargement : ${e.localizedMessage}")
            }
        }
    }

    fun updateStudent(idEleve: Long, payload: StudentRegistrationPayload, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val response = api.updateStudent(idEleve, payload)
                val errorMsg = if (!response.isSuccessful) {
                    val errorBody = response.errorBody()?.string()
                    try {
                        val json = org.json.JSONObject(errorBody)
                        json.getString("error")
                    } catch (e: Exception) {
                        "Erreur serveur (${response.code()})"
                    }
                } else null

                withContext(Dispatchers.Main) {
                    onResult(response.isSuccessful, errorMsg)
                }
                if (response.isSuccessful) {
                    chargerElevesParSalle(payload.idAnneeScolaire, 0L)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    onResult(false, e.localizedMessage)
                }
            }
        }
    }

    fun deleteEnrollment(idEleve: Long, idAnneeScolaire: Long, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val response = api.deleteEnrollment(idEleve, idAnneeScolaire)
                val errorMsg = if (!response.isSuccessful) {
                    val errorBody = response.errorBody()?.string()
                    // Essayer d'extraire le message d'erreur JSON
                    try {
                        val json = org.json.JSONObject(errorBody)
                        json.getString("error")
                    } catch (e: Exception) {
                        "Erreur serveur (${response.code()})"
                    }
                } else null

                withContext(Dispatchers.Main) {
                    onResult(response.isSuccessful, errorMsg)
                }
                if (response.isSuccessful) {
                    chargerElevesParSalle(idAnneeScolaire, 0L)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    onResult(false, e.localizedMessage)
                }
            }
        }
    }

    fun getReceiptData(idEleve: Long, idAnneeScolaire: Long, isSimple: Boolean = false, onResult: (ReceiptData?) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            android.util.Log.d("StudentVM", "📡 [Receipt] Requesting data for Student:$idEleve Year:$idAnneeScolaire (Simple:$isSimple)")
            try {
                val response = if (isSimple) {
                    api.getSimpleRegistrationReceiptData(idEleve, idAnneeScolaire)
                } else {
                    api.getRegistrationReceiptData(idEleve, idAnneeScolaire)
                }
                
                withContext(Dispatchers.Main) {
                    if (response.isSuccessful) {
                        android.util.Log.d("StudentVM", "✅ [Receipt] Data received successfully")
                        onResult(response.body())
                    } else {
                        val errorBody = response.errorBody()?.string()
                        android.util.Log.e("StudentVM", "❌ [Receipt] Error ${response.code()}: $errorBody")
                        onResult(null)
                    }
                }
            } catch (e: Exception) {
                android.util.Log.e("StudentVM", "🔥 [Receipt] Exception: ${e.localizedMessage}", e)
                withContext(Dispatchers.Main) {
                    onResult(null)
                }
            }
        }
    }

    fun checkStudentTransfer(idEleve: Long, idAnneeScolaire: Long, onResult: (Boolean, String?) -> Unit) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                // Mock logic for now or specific API
                // val response = api.checkTransfer(idEleve, idAnneeScolaire)
                // Let's assume we fetch details and check hasGrades / hasPayments
                val allStudents = api.getAllStudents(idAnneeScolaire)
                val student = allStudents.body()?.find { it.idEleve == idEleve }
                withContext(Dispatchers.Main) {
                    if (student != null) {
                        if (student.hasGrades) {
                            onResult(false, "Impossible : L'élève a déjà des notes enregistrées cette année.")
                        } else if (student.hasAnyPayment) {
                            onResult(false, "Impossible : L'élève a déjà effectué des paiements.")
                        } else {
                            onResult(true, null)
                        }
                    } else {
                        onResult(false, "Élève introuvable.")
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    onResult(false, "Erreur réseau.")
                }
            }
        }
    }

    fun registerAndEnrollStudent(payload: StudentRegistrationPayload) {
        viewModelScope.launch(Dispatchers.IO) {
            _registrationState.value = SaveState.SAVING_REMOTE
            withContext(Dispatchers.Main) {
                _syncEvents.emit("Inscription de l'élève sur le serveur...")
            }
            try {
                val response = api.registerAndEnrollStudent(payload)
                if (response.isSuccessful) {
                    withContext(Dispatchers.Main) {
                        _syncEvents.emit("✅ Élève inscrit sur le serveur avec succès.")
                    }
                    _registrationState.value = SaveState.SUCCESS
                    // Recharger la liste globale immédiatement après l'inscription
                    withContext(Dispatchers.Main) {
                        _syncEvents.emit("Mise à jour de la liste locale...")
                    }
                    chargerElevesParSalle(payload.idAnneeScolaire, 0L)
                    withContext(Dispatchers.Main) {
                        _syncEvents.emit("🚀 Opération terminée : Base de données synchronisée.")
                    }
                } else {
                    _registrationState.value = SaveState.ERROR("Refus du serveur (Code ${response.code()})")
                    withContext(Dispatchers.Main) {
                        _syncEvents.emit("❌ Erreur serveur lors de l'inscription.")
                    }
                }
            } catch (e: Exception) {
                _registrationState.value = SaveState.ERROR(e.localizedMessage ?: "Erreur réseau")
                withContext(Dispatchers.Main) {
                    _syncEvents.emit("⚠️ Erreur réseau : Inscription impossible.")
                }
            }
        }
    }

    fun resetRegistrationState() {
        _registrationState.value = SaveState.IDLE
    }
}