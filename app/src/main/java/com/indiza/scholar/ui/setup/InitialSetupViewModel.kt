package com.indiza.scholar.ui.setup

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.dao.AnneeScolaireDao
import com.indiza.scholar.dao.EtablissementDao
import com.indiza.scholar.model.*
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.repositories.PersonnelRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

enum class SetupStep { LANDING, SELECT_LANGUAGE, WELCOME, SELECT_SCHOOL, SELECT_PROFILE, SELECT_YEAR, SECURITY_PIN }

data class SetupUiState(
    val currentStep: SetupStep = SetupStep.LANDING,
    val selectedLanguage: String? = null,
    val selectedSchool: EtablissementEntity? = null,
    val selectedProfile: String? = null,
    val selectedYear: AnneeScolaireEntity? = null,
    val schools: List<EtablissementEntity> = emptyList(),
    val userSchools: List<EtablissementEntity> = emptyList(),
    val userAssociations: List<UserAssociation> = emptyList(),
    val availableProfiles: List<String> = emptyList(),
    val availableMatieres: List<MatiereEntity> = emptyList(),
    val selectedSpecialties: List<Long> = emptyList(),
    val years: List<AnneeScolaireEntity> = emptyList(),
    val isLoading: Boolean = false,
    val pinValue: String = "",
    val isCreatingSchool: Boolean = false,
    val isNewUser: Boolean = false,
    val error: String? = null,
    val userId: Long = -1,
    val userRole: AcademicRole = AcademicRole.ENSEIGNANT,
    val initialPays: String? = null,
    val initialVille: String? = null,
    val initialArrete: String? = null,
    val recruitmentCode: String? = null,
    val inscriptionCode: String? = null
)

class InitialSetupViewModel(
    private val api: ApiService,
    private val schoolDao: EtablissementDao,
    private val yearDao: AnneeScolaireDao,
    private val personnelRepo: PersonnelRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(SetupUiState())
    val uiState: StateFlow<SetupUiState> = _uiState.asStateFlow()

    private val _syncEvents = MutableSharedFlow<String>()
    val syncEvents: SharedFlow<String> = _syncEvents.asSharedFlow()

    private var userFullName: String = ""
    private var userPhone: Long = 0L
    private var userEmail: String? = null

    fun setUserId(id: Long, name: String, phone: Long, email: String?) {
        _uiState.update { it.copy(userId = id) }
        userFullName = name
        userPhone = phone
        userEmail = email
        checkSyncStatus()
    }

    private fun checkSyncStatus() {
        val userId = _uiState.value.userId
        if (userId <= 0) return
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = api.getUserAssociations(userId)
                Log.d("InitialSetupVM", "📥 Réponse UserAssociations: ${response.code()}")
                if (response.isSuccessful) {
                    val associations = response.body() ?: emptyList()
                    Log.d("InitialSetupVM", "✅ Associations trouvées: ${associations.size}")
                    _uiState.update { it.copy(
                        userAssociations = associations,
                        isNewUser = associations.isEmpty()
                    ) }
                } else {
                    _uiState.update { it.copy(error = "Erreur serveur (${response.code()})") }
                }
            } catch (e: Exception) {
                Log.e("InitialSetupVM", "❌ Erreur réseau checkSyncStatus", e)
                _uiState.update { it.copy(error = "Serveur injoignable. Vérifiez votre IP.") }
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    fun jumpToStep(step: SetupStep) {
        _uiState.update { it.copy(currentStep = step) }
    }

    fun startCreateSchool(pays: String, ville: String, arrete: String) {
        _uiState.update { it.copy(
            initialPays = pays,
            initialVille = ville,
            initialArrete = arrete,
            currentStep = SetupStep.SELECT_LANGUAGE
        ) }
    }

    fun startJoinStaff(code: String) {
        _uiState.update { it.copy(
            recruitmentCode = code,
            currentStep = SetupStep.SELECT_SCHOOL
        ) }
    }

    fun startJoinStudent(code: String, onComplete: () -> Unit) {
        // Logic to verify student code would go here
        onComplete()
    }

    fun selectLanguage(lang: String) {
        val nextStep = if (_uiState.value.isNewUser) SetupStep.WELCOME else SetupStep.SELECT_SCHOOL
        _uiState.update { it.copy(
            selectedLanguage = lang,
            currentStep = nextStep
        ) }
    }

    fun searchSchools(query: String) {
        if (query.length < 3) return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = api.searchSchools(query)
                if (response.isSuccessful) {
                    _uiState.update { it.copy(schools = response.body() ?: emptyList()) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Erreur de connexion") }
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    fun selectSchool(school: EtablissementEntity) {
        val assoc = _uiState.value.userAssociations.find { it.school.idServeur == school.idServeur }
        val isValidated = assoc != null && assoc.etat == "VALIDE"
        
        _uiState.update { it.copy(
            selectedSchool = school,
            isCreatingSchool = school.idCreateur == _uiState.value.userId,
            // On ne propose le profil que si validé
            selectedProfile = if (isValidated && assoc!!.roles.size == 1) assoc.roles.first() else null
        ) }
    }

    fun validateSchool(onNewDemandSent: () -> Unit) {
        val state = _uiState.value
        val school = state.selectedSchool ?: return
        
        viewModelScope.launch {
            schoolDao.insertOrUpdate(school)
            
            val assoc = state.userAssociations.find { it.school.idServeur == school.idServeur }
            
            if (assoc != null) {
                // Scenario A: Existing association
                if (assoc.etat == "VALIDE") {
                    if (assoc.roles.size > 1) {
                        _uiState.update { it.copy(
                            currentStep = SetupStep.SELECT_PROFILE,
                            availableProfiles = assoc.roles + listOf("AJOUTER_AUTRE_POSTE")
                        ) }
                    } else if (assoc.roles.isNotEmpty()) {
                        val profile = assoc.roles.first()
                        _uiState.update { it.copy(
                            selectedProfile = profile,
                            currentStep = SetupStep.SELECT_YEAR
                        ) }
                        loadYears(school.idServeur!!)
                    }
                } else {
                    // Association trouvée mais en attente (EN_ATTENTE)
                    onNewDemandSent()
                }
            } else {
                // Scenario B: New user to school
                if (school.idCreateur == state.userId) {
                    _uiState.update { it.copy(
                        selectedProfile = "ADMINISTRATEUR",
                        currentStep = SetupStep.SELECT_YEAR
                    ) }
                    loadYears(school.idServeur!!)
                } else {
                    submitAutomaticDemand(onNewDemandSent)
                }
            }
        }
    }

    private fun submitAutomaticDemand(onSuccess: () -> Unit) {
        val state = _uiState.value
        val school = state.selectedSchool ?: return
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, selectedProfile = "EMPLOYE", error = null) }
            try {
                val payload = DemandeInscriptionPayload(
                    idUtilisateur = state.userId,
                    idEtablissement = school.idServeur!!,
                    profilDemande = "EMPLOYE",
                    nom = userFullName.split(" ").firstOrNull() ?: "Utilisateur", 
                    prenom = userFullName.split(" ").lastOrNull() ?: "Scholar",
                    telephone1 = userPhone,
                    email = userEmail,
                    specialites = null
                )
                val response = personnelRepo.envoyerDemande(payload)
                if (response.isSuccessful || response.code() == 409) {
                    onSuccess()
                } else {
                    _uiState.update { it.copy(error = "Échec de l'envoi de la demande") }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Serveur injoignable") }
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    fun selectProfile(profile: String) {
        if (profile == "AJOUTER_AUTRE_POSTE") {
            _uiState.update { it.copy(
                availableProfiles = listOf("DIRECTEUR", "DIRECTEUR_DES_ETUDES", "SURVEILLANT_GENERAL", "ENSEIGNANT", "INTENDANT", "SECRETAIRE"),
                selectedProfile = null
            ) }
        } else {
            _uiState.update { it.copy(selectedProfile = profile) }
            if (profile == "ENSEIGNANT") {
                loadMatieres()
            }
        }
    }

    private fun loadMatieres() {
        viewModelScope.launch {
            try {
                val response = api.getMatieres()
                if (response.isSuccessful) {
                    _uiState.update { it.copy(availableMatieres = response.body() ?: emptyList()) }
                }
            } catch (e: Exception) {
                Log.e("InitialSetupVM", "Erreur loadMatieres", e)
            }
        }
    }

    fun toggleSpecialty(idMatiere: Long) {
        _uiState.update { current ->
            val specialties = current.selectedSpecialties.toMutableList()
            if (specialties.contains(idMatiere)) {
                specialties.remove(idMatiere)
            } else if (specialties.size < 4) {
                specialties.add(idMatiere)
            }
            current.copy(selectedSpecialties = specialties)
        }
    }

    fun validateProfile(onNewDemandSent: () -> Unit) {
        val state = _uiState.value
        val school = state.selectedSchool ?: return
        val profile = state.selectedProfile ?: return
        
        val assoc = state.userAssociations.find { it.school.idServeur == school.idServeur }
        val hasThisRole = assoc?.roles?.contains(profile) ?: false

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                if (hasThisRole) {
                    _uiState.update { it.copy(currentStep = SetupStep.SELECT_YEAR) }
                    loadYears(school.idServeur!!)
                } else {
                    val payload = DemandeInscriptionPayload(
                        idUtilisateur = state.userId,
                        idEtablissement = school.idServeur!!,
                        profilDemande = profile,
                        nom = userFullName.split(" ").firstOrNull() ?: "Utilisateur", 
                        prenom = userFullName.split(" ").lastOrNull() ?: "Scholar",
                        telephone1 = userPhone,
                        email = userEmail,
                        specialites = if (profile == "ENSEIGNANT") state.selectedSpecialties.joinToString(",") else null
                    )
                    val response = personnelRepo.envoyerDemande(payload)
                    if (response.isSuccessful || response.code() == 409) {
                        onNewDemandSent()
                    } else {
                        _uiState.update { it.copy(error = "Échec de l'envoi de la demande") }
                    }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Erreur de connexion") }
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    fun createSchool(
        nomFr: String, nomEn: String?, abreviation: String?, ville: String?, 
        telephone1: Long, email: String?, deviseFr: String?, deviseEn: String?, description: String?
    ) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            _syncEvents.emit("Création de l'établissement sur le serveur...")
            try {
                val newSchool = EtablissementEntity(
                    nomFr = nomFr, nomEn = nomEn, abreviation = abreviation, ville = ville, 
                    telephone1 = telephone1, email = email, deviseFr = deviseFr, deviseEn = deviseEn, 
                    description = description, idCreateur = _uiState.value.userId
                )
                val response = api.createSchool(newSchool)
                if (response.isSuccessful) {
                    val savedSchool = response.body()!!
                    _syncEvents.emit("✅ Établissement créé sur le serveur. Synchronisation locale...")
                    schoolDao.insertOrUpdate(savedSchool)
                    _uiState.update { it.copy(
                        selectedSchool = savedSchool,
                        isCreatingSchool = true,
                        currentStep = SetupStep.SELECT_YEAR
                    ) }
                    _syncEvents.emit("🚀 Établissement prêt.")
                    loadYears(savedSchool.idServeur ?: 0)
                } else {
                    _syncEvents.emit("❌ Erreur serveur lors de la création.")
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Erreur réseau : Impossible de créer l'école") }
                _syncEvents.emit("⚠️ Erreur réseau.")
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    private fun loadYears(schoolId: Long) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val response = api.getYearsBySchool(schoolId)
                if (response.isSuccessful) {
                    val years = response.body() ?: emptyList()
                    _uiState.update { it.copy(
                        years = years,
                        selectedYear = years.maxByOrNull { it.dateDebut }
                    ) }
                } else {
                    _uiState.update { it.copy(error = "Erreur chargement années") }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Serveur injoignable") }
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    fun selectYear(year: AnneeScolaireEntity) {
        _uiState.update { it.copy(selectedYear = year) }
    }

    fun createYear(libelle: String, start: String, end: String) {
        val school = _uiState.value.selectedSchool ?: return
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            _syncEvents.emit("Configuration de l'année sur le serveur...")
            try {
                val newYear = AnneeScolaireEntity(
                    libelleAnneeScolaire = libelle,
                    dateDebut = start,
                    dateFin = end,
                    idEtablissement = school.idServeur,
                    idServeur = null
                )
                val response = api.createAnnee(newYear)
                if (response.isSuccessful) {
                    val savedYear = response.body()!!
                    _syncEvents.emit("✅ Année enregistrée sur le serveur.")
                    yearDao.insertOrUpdate(savedYear)
                    _uiState.update { it.copy(
                        selectedYear = savedYear,
                        currentStep = SetupStep.SECURITY_PIN
                    ) }
                } else {
                    _syncEvents.emit("❌ Échec de la création distante.")
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Erreur réseau") }
                _syncEvents.emit("⚠️ Erreur réseau.")
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    fun validateYear() {
        val year = _uiState.value.selectedYear
        if (year != null) {
            viewModelScope.launch {
                yearDao.insertOrUpdate(year)
                _uiState.update { it.copy(currentStep = SetupStep.SECURITY_PIN) }
            }
        }
    }

    fun onPinChanged(pin: String) {
        if (pin.length <= 4) {
            _uiState.update { it.copy(pinValue = pin, error = null) }
        }
    }

    fun verifyOrSetPin(onSuccess: (Long, Long, String) -> Unit) {
        val state = _uiState.value
        if (state.pinValue.length == 4) {
            if (state.isCreatingSchool) {
                viewModelScope.launch {
                    try {
                        val schoolWithPin = state.selectedSchool!!.copy(pinSecurite = state.pinValue)
                        api.updateSchool(schoolWithPin.idServeur!!, schoolWithPin)
                        schoolDao.insertOrUpdate(schoolWithPin)
                        onSuccess(schoolWithPin.idServeur, state.selectedYear?.idServeur ?: 0L, state.selectedLanguage ?: "Français")
                    } catch (e: Exception) {
                        _uiState.update { it.copy(error = "Erreur de sauvegarde PIN") }
                    }
                }
            } else {
                if (state.pinValue == state.selectedSchool?.pinSecurite) {
                    onSuccess(state.selectedSchool.idServeur!!, state.selectedYear?.idServeur ?: 0L, state.selectedLanguage ?: "Français")
                } else {
                    _uiState.update { it.copy(error = "PIN Incorrect") }
                }
            }
        }
    }
}
