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
        Log.d("InitialSetupVM", "👤 [setUserId] User: $name (ID: $id), Phone: $phone, Email: $email")
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
                Log.d("InitialSetupVM", "📥 [checkSyncStatus] Response: ${response.code()}")
                if (response.isSuccessful) {
                    val associations = response.body() ?: emptyList()
                    Log.d("InitialSetupVM", "✅ [checkSyncStatus] ${associations.size} associations trouvées")
                    associations.forEach { 
                        Log.d("InitialSetupVM", "   - School: ${it.school.nomFr}, Status: ${it.etat}")
                    }
                    _uiState.update { it.copy(
                        userAssociations = associations,
                        isNewUser = associations.isEmpty()
                    ) }
                } else {
                    _uiState.update { it.copy(error = "Erreur serveur (${response.code()})") }
                }
            } catch (e: Exception) {
                Log.e("InitialSetupVM", "❌ Erreur réseau checkSyncStatus", e)
                // Si le serveur est injoignable au démarrage, on n'affiche pas d'erreur bloquante
                // mais on marque l'utilisateur comme "nouveau" pour lui permettre de chercher une école
                _uiState.update { it.copy(isNewUser = true) }
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    fun jumpToStep(step: SetupStep) {
        _uiState.update { it.copy(currentStep = step, error = null) }
    }

    fun startCreateSchool(pays: String, ville: String, arrete: String) {
        _uiState.update { it.copy(
            initialPays = pays,
            initialVille = ville,
            initialArrete = arrete,
            currentStep = SetupStep.SELECT_LANGUAGE
        ) }
    }

    fun startJoinStaff() {
        _uiState.update { it.copy(
            selectedProfile = "ENSEIGNANT",
            currentStep = SetupStep.SELECT_SCHOOL,
            error = null,
            recruitmentCode = null
        ) }
    }

    fun startJoinStudent() {
        _uiState.update { it.copy(
            selectedProfile = "ELEVE",
            currentStep = SetupStep.SELECT_SCHOOL,
            error = null,
            inscriptionCode = null
        ) }
    }

    fun onRecruitmentCodeChanged(code: String) {
        _uiState.update { it.copy(recruitmentCode = code) }
    }

    fun onInscriptionCodeChanged(code: String) {
        _uiState.update { it.copy(inscriptionCode = code) }
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
        val currentAssocs = _uiState.value.userAssociations
        Log.d("InitialSetupVM", "🏫 [SelectSchool] Clicked: ${school.nomFr} (ID: ${school.idServeur})")
        Log.d("InitialSetupVM", "📚 [SelectSchool] Current user associations count: ${currentAssocs.size}")
        
        // Debug: Lister les IDs des associations connues
        currentAssocs.forEach { 
            Log.d("InitialSetupVM", "   -> List item: ${it.school.nomFr} (ServerID: ${it.school.idServeur}) - Status: ${it.etat}")
        }

        // Recherche plus robuste (par ID serveur ou par nom si l'ID est null)
        val assoc = currentAssocs.find { 
            (it.school.idServeur != null && it.school.idServeur == school.idServeur) || 
            (it.school.nomFr == school.nomFr && it.school.ville == school.ville)
        }
        
        val isValidated = assoc != null && assoc.etat == "VALIDE"
        Log.d("InitialSetupVM", "🔍 [SelectSchool] Matching assoc found: ${assoc != null}, Validated: $isValidated, Status: ${assoc?.etat ?: "null"}")

        _uiState.update { it.copy(
            selectedSchool = school,
            isCreatingSchool = school.idCreateur == _uiState.value.userId,
            isNewUser = assoc == null,
            error = null,
            selectedProfile = if (isValidated && assoc!!.roles.size == 1) {
                Log.d("InitialSetupVM", "👤 [SelectSchool] Auto-selecting profile: ${assoc.roles.first()}")
                assoc.roles.first()
            } else {
                it.selectedProfile
            }
        ) }
        
        if (isValidated && assoc!!.roles.size > 1) {
            Log.d("InitialSetupVM", "👥 [SelectSchool] Multiple roles detected, will need profile selection")
        }
    }

    fun validateSchool(onNewDemandSent: () -> Unit) {
        val state = _uiState.value
        val school = state.selectedSchool ?: return
        
        Log.d("InitialSetupVM", "🚀 [ValidateSchool] Start - School: ${school.nomFr}, Profile: ${state.selectedProfile}")
        
        viewModelScope.launch {
            schoolDao.insertOrUpdate(school)
            
            val assoc = state.userAssociations.find { it.school.idServeur == school.idServeur }
            Log.d("InitialSetupVM", "🔍 [ValidateSchool] Existing Association: ${assoc?.etat ?: "NONE"}")
            
            if (assoc != null) {
                // Scenario A: Existing association
                if (assoc.etat == "VALIDE") {
                    Log.d("InitialSetupVM", "✅ Association VALIDE trouvée pour l'école ${school.nomFr}")
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
                    Log.d("InitialSetupVM", "⏳ Association EN_ATTENTE trouvée pour l'école ${school.nomFr}")
                    onNewDemandSent()
                }
            } else {
                // Scenario B: New user to school
                if (school.idCreateur == state.userId) {
                    Log.d("InitialSetupVM", "👑 Créateur détecté, passage à l'année scolaire")
                    _uiState.update { it.copy(
                        selectedProfile = "ADMINISTRATEUR",
                        currentStep = SetupStep.SELECT_YEAR
                    ) }
                    loadYears(school.idServeur!!)
                } else {
                    // Vérification du code
                    val isStaff = state.selectedProfile != "ELEVE"
                    val enteredCode = if (isStaff) state.recruitmentCode else state.inscriptionCode
                    val expectedCode = if (isStaff) school.codeRecrutement else school.codeInscription

                    Log.d("InitialSetupVM", "🔑 Vérification code pour ${state.selectedProfile}: Saisi=$enteredCode, Attendu=$expectedCode")

                    if (enteredCode != expectedCode) {
                        _uiState.update { it.copy(error = "Code ${if (isStaff) "de recrutement" else "d'inscription"} invalide") }
                        return@launch
                    }

                    submitAutomaticDemand(onNewDemandSent)
                }
            }
        }
    }

    private fun submitAutomaticDemand(onSuccess: () -> Unit) {
        val state = _uiState.value
        val school = state.selectedSchool ?: return
        val profile = state.selectedProfile ?: "ENSEIGNANT"
        
        Log.d("InitialSetupVM", "📤 [SubmitDemand] Sending demand - User: ${state.userId}, School: ${school.idServeur}, Profile: $profile")
        
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val payload = DemandeInscriptionPayload(
                    idUtilisateur = state.userId,
                    idEtablissement = school.idServeur!!,
                    profilDemande = profile,
                    nom = userFullName.split(" ").firstOrNull() ?: "Utilisateur", 
                    prenom = userFullName.split(" ").lastOrNull() ?: "Scholar",
                    telephone1 = userPhone,
                    email = userEmail,
                    specialites = null
                )
                val response = personnelRepo.envoyerDemande(payload)
                Log.d("InitialSetupVM", "📥 [SubmitDemand] Response Code: ${response.code()}")
                
                if (response.isSuccessful) {
                    Log.d("InitialSetupVM", "✅ [SubmitDemand] Success")
                    // Refresh associations to show the new pending demand
                    val freshAssocs = api.getUserAssociations(state.userId)
                    if (freshAssocs.isSuccessful) {
                        _uiState.update { it.copy(userAssociations = freshAssocs.body() ?: emptyList()) }
                    }
                    onSuccess()
                } else if (response.code() == 409) {
                    Log.w("InitialSetupVM", "⚠️ [SubmitDemand] Conflict 409 - Checking if already validated")
                    // Si une demande existe déjà, on vérifie si l'utilisateur n'est pas déjà validé
                    try {
                        val freshAssocs = api.getUserAssociations(state.userId)
                        Log.d("InitialSetupVM", "📥 [SubmitDemand] Refresh associations code: ${freshAssocs.code()}")
                        
                        if (freshAssocs.isSuccessful) {
                            val associations = freshAssocs.body()
                            Log.d("InitialSetupVM", "📥 [SubmitDemand] Raw body received: ${associations?.size ?: "NULL"} items")
                            
                            if (associations != null) {
                                associations.forEach { 
                                    Log.d("InitialSetupVM", "   -> Association: School=${it.school.nomFr} (ID: ${it.school.idServeur}), Status=${it.etat}, Roles=${it.roles}")
                                }
                                
                                _uiState.update { it.copy(userAssociations = associations) }
                                
                                // Recherche flexible
                                val targetId = school.idServeur
                                val existingValid = associations.find { 
                                    (it.school.idServeur != null && it.school.idServeur == targetId) && it.etat == "VALIDE" 
                                }
                                
                                if (existingValid != null) {
                                    Log.d("InitialSetupVM", "✨ [SubmitDemand] Found VALIDE association. Redirecting to select year.")
                                    _uiState.update { it.copy(
                                        selectedProfile = existingValid.roles.firstOrNull() ?: profile,
                                        currentStep = SetupStep.SELECT_YEAR
                                    ) }
                                    loadYears(school.idServeur!!)
                                } else {
                                    val existingPending = associations.find { it.school.idServeur == targetId }
                                    Log.d("InitialSetupVM", "⏳ [SubmitDemand] No VALIDE assoc. Status for this school: ${existingPending?.etat ?: "STILL_NONE"}")
                                    _uiState.update { it.copy(error = "Une demande est déjà en cours d'étude pour cet établissement.") }
                                }
                            }
                        } else {
                            Log.e("InitialSetupVM", "❌ [SubmitDemand] API Error: ${freshAssocs.errorBody()?.string()}")
                        }
                    } catch (e: Exception) {
                        Log.e("InitialSetupVM", "🔥 [SubmitDemand] Critical error during association refresh", e)
                        _uiState.update { it.copy(error = "Erreur lors de la synchronisation des accès") }
                    }
                } else {
                    Log.e("InitialSetupVM", "❌ [SubmitDemand] Server Error: ${response.errorBody()?.string()}")
                    _uiState.update { it.copy(error = "Échec de l'envoi de la demande") }
                }
            } catch (e: Exception) {
                Log.e("InitialSetupVM", "🔥 [SubmitDemand] Exception", e)
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
        
        Log.d("InitialSetupVM", "👤 [ValidateProfile] profile: $profile, specialties: ${state.selectedSpecialties}")

        val assoc = state.userAssociations.find { it.school.idServeur == school.idServeur }
        val hasThisRole = assoc?.roles?.contains(profile) ?: false

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                if (hasThisRole) {
                    Log.d("InitialSetupVM", "✅ [ValidateProfile] Role already owned. Proceeding to Years.")
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
                    Log.d("InitialSetupVM", "📥 [ValidateProfile] Response Code: ${response.code()}")
                    
                    if (response.isSuccessful) {
                        Log.d("InitialSetupVM", "✅ [ValidateProfile] Demand Sent Successfully")
                        onNewDemandSent()
                    } else if (response.code() == 409) {
                        Log.w("InitialSetupVM", "⚠️ [ValidateProfile] Conflict 409 - Checking status")
                        // Cas similaire au profil : on vérifie si entre-temps il n'a pas été validé
                        val freshAssocs = api.getUserAssociations(state.userId)
                        if (freshAssocs.isSuccessful) {
                            val associations = freshAssocs.body() ?: emptyList()
                            Log.d("InitialSetupVM", "📥 [ValidateProfile] Refresh successful: ${associations.size} associations found")
                            _uiState.update { it.copy(userAssociations = associations) }
                            
                            val existingValid = associations.find { it.school.idServeur == school.idServeur && it.etat == "VALIDE" }
                            if (existingValid != null) {
                                Log.d("InitialSetupVM", "✨ [ValidateProfile] Found VALIDE association. Redirecting.")
                                _uiState.update { it.copy(currentStep = SetupStep.SELECT_YEAR) }
                                loadYears(school.idServeur!!)
                            } else {
                                Log.d("InitialSetupVM", "⏳ [ValidateProfile] Still pending or not found.")
                                _uiState.update { it.copy(error = "Demande déjà enregistrée en attente.") }
                            }
                        } else {
                            Log.e("InitialSetupVM", "❌ [ValidateProfile] Failed to fetch associations: ${freshAssocs.code()}")
                            _uiState.update { it.copy(error = "Conflit détecté (Demande déjà existante)") }
                        }
                    } else {
                        Log.e("InitialSetupVM", "❌ [ValidateProfile] Error: ${response.errorBody()?.string()}")
                        _uiState.update { it.copy(error = "Échec de l'envoi de la demande") }
                    }
                }
            } catch (e: Exception) {
                Log.e("InitialSetupVM", "🔥 [ValidateProfile] Exception", e)
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
            Log.d("InitialSetupVM", "📅 Chargement des années pour l'école ID: $schoolId")
            try {
                val response = api.getYearsBySchool(schoolId)
                Log.d("InitialSetupVM", "📅 Réponse getYearsBySchool: ${response.code()}")
                if (response.isSuccessful) {
                    val years = response.body() ?: emptyList()
                    Log.d("InitialSetupVM", "📅 ${years.size} années récupérées.")
                    _uiState.update { it.copy(
                        years = years,
                        selectedYear = years.maxByOrNull { it.dateDebut }
                    ) }
                } else {
                    _uiState.update { it.copy(error = "Erreur chargement années (${response.code()})") }
                }
            } catch (e: Exception) {
                Log.e("InitialSetupVM", "❌ Erreur loadYears", e)
                _uiState.update { it.copy(error = "Serveur injoignable (Vérifiez votre IP)") }
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
