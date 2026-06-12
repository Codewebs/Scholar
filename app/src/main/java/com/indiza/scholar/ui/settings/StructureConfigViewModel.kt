package com.indiza.scholar.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.dao.StructureDao
import com.indiza.scholar.model.ClasseEntity
import com.indiza.scholar.model.ClassePayload
import com.indiza.scholar.model.CycleEntity
import com.indiza.scholar.model.CyclePayload
import com.indiza.scholar.model.EnseignementEntity
import com.indiza.scholar.model.PredefinedClasse
import com.indiza.scholar.model.PredefinedCountry
import com.indiza.scholar.model.PredefinedCycle
import com.indiza.scholar.model.PredefinedProfil
import com.indiza.scholar.model.StructurePayload
import com.indiza.scholar.network.ApiService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.collections.forEachIndexed

import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlin.collections.forEachIndexed

sealed class SaveState {
    object IDLE : SaveState()
    object SAVING_REMOTE : SaveState()
    object SAVING_LOCAL : SaveState()
    object SUCCESS : SaveState()
    data class ERROR(val error: String) : SaveState()
}

sealed class AcademicUIState {
    data class Loading(val currentData: List<EnseignementEntity> = emptyList()) : AcademicUIState()
    data class Empty(val alreadyConfigured: List<EnseignementEntity> = emptyList()) : AcademicUIState()
    data class HasConfig(val listEnseignements: List<EnseignementEntity>) : AcademicUIState()
}

class StructureConfigViewModel(
    private val dao: StructureDao,
    private val api: ApiService
) : ViewModel() {

    private val _saveState = MutableStateFlow<SaveState>(SaveState.IDLE)
    val saveState: StateFlow<SaveState> = _saveState.asStateFlow()

    private val _uiState = MutableStateFlow<AcademicUIState>(AcademicUIState.Loading())
    val uiState: StateFlow<AcademicUIState> = _uiState.asStateFlow()

    fun triggerRefresh(idAnneeScolaire: Long) {
        verifierConfigurationExistante(idAnneeScolaire)
    }

    private val _educationProfiles = MutableStateFlow<List<PredefinedCountry>>(emptyList())
    val educationProfiles: StateFlow<List<PredefinedCountry>> = _educationProfiles.asStateFlow()

    private val _syncEvents = MutableSharedFlow<String>()
    val syncEvents: SharedFlow<String> = _syncEvents.asSharedFlow()

    init {
        loadEducationProfiles()
    }

    private fun loadEducationProfiles() {
        viewModelScope.launch {
            try {
                val response = api.getEducationProfiles()
                if (response.isSuccessful) {
                    val profiles = response.body()?.countries ?: emptyList()
                    println("🌍 [StructureConfig] Profils chargés : ${profiles.size} pays")
                    _educationProfiles.value = profiles
                } else {
                    println("❌ [StructureConfig] Erreur chargement profils : ${response.code()}")
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    // Store loaded details for bottom sheet
    private val _profileDetails = MutableStateFlow<Map<CycleEntity, List<ClasseEntity>>>(emptyMap())
    val profileDetails: StateFlow<Map<CycleEntity, List<ClasseEntity>>> = _profileDetails.asStateFlow()

    fun resetSaveState() {
        _saveState.value = SaveState.IDLE
    }

    fun verifierConfigurationExistante(idAnneeScolaire: Long) {
        if (idAnneeScolaire <= 0L) {
            println("⚠️ [StructureVM] Année scolaire invalide ($idAnneeScolaire).")
            _uiState.value = AcademicUIState.Empty()
            return
        }

        viewModelScope.launch(Dispatchers.IO) {
            println("🔍 [StructureVM] --- DEBUT VERIFICATION (Année: $idAnneeScolaire) ---")
            
            // 1. Chargement immédiat depuis Room (Priorité Affichage)
            val currentLocal = dao.getEnseignementsByAnnee(idAnneeScolaire)
            if (currentLocal.isNotEmpty()) {
                println("📱 [StructureVM] Local: ${currentLocal.size} profils trouvés. Affichage immédiat.")
                _uiState.value = AcademicUIState.HasConfig(currentLocal)
            } else {
                println("📱 [StructureVM] Local: Vide. Passage en mode Loading.")
                _uiState.value = AcademicUIState.Loading()
            }

            try {
                // 2. Synchronisation Réseau en arrière-plan
                println("🌐 [StructureVM] Appel API getStructureByAnnee...")
                val response = api.getStructureByAnnee(idAnneeScolaire)
                
                if (response.isSuccessful && response.body() != null) {
                    val remoteEnseignements = response.body()!!
                    println("📊 [StructureVM] Serveur: ${remoteEnseignements.size} profils renvoyés.")
                    
                    if (remoteEnseignements.isNotEmpty()) {
                        println("💾 [StructureVM] Nettoyage et insertion dans Room...")
                        dao.clearFullStructurePourAnnee(idAnneeScolaire)
                        
                        remoteEnseignements.forEach { ens ->
                            val localEnsId = dao.insertEnseignement(EnseignementEntity(
                                idServeur = ens.idEnseignement,
                                idAnneeScolaire = idAnneeScolaire,
                                enseignementFr = ens.enseignementFr,
                                enseignementEn = ens.enseignementEn,
                                enseignementEs = ens.enseignementEs
                            ))
                            
                            ens.cycles.forEach { cyc ->
                                val localCycId = dao.insertCycle(CycleEntity(
                                    idAnneeScolaire = idAnneeScolaire,
                                    idEnseignementLocal = localEnsId,
                                    idServeur = cyc.idCycle,
                                    libelleCycleFr = cyc.libelleCycleFr,
                                    libelleCycleEn = cyc.libelleCycleEn ?: "",
                                    libelleCycleEs = cyc.libelleCycleEs ?: "",
                                    ordre = cyc.ordre
                                ))

                                val classes = cyc.classes.map { cl ->
                                    ClasseEntity(
                                        idAnneeScolaire = idAnneeScolaire,
                                        idCycleLocal = localCycId,
                                        idServeur = cl.idClasse,
                                        libelleClasseFr = cl.libelleClasseFr,
                                        libelleClasseEn = cl.libelleClasseEn ?: "",
                                        libelleClasseEs = cl.libelleClasseEs ?: "",
                                        abreviation = cl.abreviation
                                    )
                                }
                                dao.insertClasses(classes)
                            }
                        }
                        println("✅ [StructureVM] Synchronisation Room terminée avec succès.")
                    } else {
                        println("⚠️ [StructureVM] Le serveur a renvoyé une liste vide.")
                    }
                } else {
                    println("❌ [StructureVM] Erreur API : Code ${response.code()}")
                }
            } catch (e: Exception) {
                println("❌ [StructureVM] Exception pendant la synchro: ${e.message}")
                e.printStackTrace()
            } finally {
                // 3. Rechargement local final pour l'UI
                val finalLocal = dao.getEnseignementsByAnnee(idAnneeScolaire)
                println("📱 [StructureVM] État final: ${finalLocal.size} profils en local.")
                _uiState.value = if (finalLocal.isEmpty()) AcademicUIState.Empty() else AcademicUIState.HasConfig(finalLocal)
                println("🔍 [StructureVM] --- FIN VERIFICATION ---")
            }
        }
    }

    fun loadProfileDetails(enseignementLocalId: Long) {
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val cycles = dao.getCyclesByEnseignement(enseignementLocalId)
                val map = mutableMapOf<CycleEntity, List<ClasseEntity>>()
                cycles.forEach { cycle ->
                    val classes = dao.getClassesByCycle(cycle.idLocal)
                    map[cycle] = classes
                }
                _profileDetails.value = map
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    // 🔄 Forcer le passage en mode édition
    fun passerEnModeModification() {
        val current = _uiState.value
        val existing = if (current is AcademicUIState.HasConfig) current.listEnseignements else emptyList()
        _uiState.value = AcademicUIState.Empty(existing)
    }

    fun sauvegarderProfilsEtablissement(idAnneeScolaire: Long, nomPays: String, selectedProfils: List<PredefinedProfil>) {
        if (idAnneeScolaire <= 0L) return
        
        viewModelScope.launch(Dispatchers.IO) {
            _saveState.value = SaveState.SAVING_REMOTE
            withContext(Dispatchers.Main) {
                _syncEvents.emit("Enregistrement des profils sur le serveur...")
            }
            try {
                // On récupère les IDs déjà configurés en base locale
                val current = _uiState.value
                val existingIds = when (current) {
                    is AcademicUIState.HasConfig -> current.listEnseignements.mapNotNull { it.idServeur }
                    is AcademicUIState.Empty -> current.alreadyConfigured.mapNotNull { it.idServeur }
                    else -> emptyList()
                }

                // Pour chaque profil sélectionné, on envoie ses détails au serveur
                for (profil in selectedProfils) {
                    // On évite de renvoyer un profil déjà configuré
                    if (existingIds.contains(profil.idEnseignement)) continue

                    val payload = StructurePayload(
                        idAnneeScolaire = idAnneeScolaire,
                        nomPays = nomPays,
                        nomProfil = profil.nomProfil,
                        enseignementFr = profil.enseignementLibelles["fr"] ?: "",
                        enseignementEn = profil.enseignementLibelles["en"] ?: "",
                        enseignementEs = profil.enseignementLibelles["es"] ?: "",
                        selectedEnseignements = listOf(profil.idEnseignement),
                        structure = profil.cycles.map { cycle ->
                            CyclePayload(
                                libelleFr = cycle.libelles["fr"] ?: "",
                                libelleEn = cycle.libelles["en"] ?: "",
                                libelleEs = cycle.libelles["es"] ?: "",
                                classes = cycle.classes.map { cl ->
                                    ClassePayload(
                                        libelleFr = cl.libelles["fr"] ?: "",
                                        libelleEn = cl.libelles["en"] ?: "",
                                        libelleEs = cl.libelles["es"] ?: "",
                                        abreviation = cl.abreviation
                                    )
                                }
                            )
                        }
                    )

                    val response = api.sauvegarderStructureDistante(payload)
                    
                    if (!response.isSuccessful) {
                        _saveState.value = SaveState.ERROR("Erreur: ${response.code()}")
                        withContext(Dispatchers.Main) {
                            _syncEvents.emit("❌ Échec de l'enregistrement pour ${profil.nomProfil}.")
                        }
                        return@launch
                    }
                }

                withContext(Dispatchers.Main) {
                    _syncEvents.emit("✅ Profils enregistrés sur le serveur. Mise à jour locale...")
                }
                _saveState.value = SaveState.SUCCESS
                // 🔄 Rafraîchissement Remote-First immédiat
                verifierConfigurationExistante(idAnneeScolaire)
                withContext(Dispatchers.Main) {
                    _syncEvents.emit("🚀 Structure synchronisée avec succès.")
                }

            } catch (e: Exception) {
                _saveState.value = SaveState.ERROR(e.localizedMessage ?: "Erreur réseau")
                withContext(Dispatchers.Main) {
                    _syncEvents.emit("⚠️ Erreur de connexion au serveur.")
                }
            }
        }
    }

    fun genererStructurePersonnalisee(
        idAnneeScolaire: Long,
        countryName: String,
        profil: PredefinedProfil,
        selectionStructure: Map<PredefinedCycle, List<PredefinedClasse>>
    ) {

        if (idAnneeScolaire <= 0L) {
            _saveState.value = SaveState.ERROR("Aucune année scolaire active n'est sélectionnée. Configuration impossible.")
            return
        }

        // 🛑 BARRIÈRE DE SÉCURITÉ 2 : L'utilisateur n'a coché aucune classe
        val aDesClasses = selectionStructure.values.any { it.isNotEmpty() }
        if (!aDesClasses) {
            _saveState.value = SaveState.ERROR("Vous devez sélectionner au moins une classe pour générer la structure.")
            return
        }

        viewModelScope.launch(Dispatchers.IO) {
            // ─── ÉTAPE 1 : Sauvegarde Distante ───
            _saveState.value = SaveState.SAVING_REMOTE

            try {
                // ✅ CORRECTION : On instancie correctement l'objet StructurePayload attendu par l'API
                val payload = StructurePayload(
                    idAnneeScolaire = idAnneeScolaire,
                    nomPays = countryName,
                    nomProfil = profil.nomProfil,
                    enseignementFr = profil.enseignementLibelles["fr"] ?: "",
                    enseignementEn = profil.enseignementLibelles["en"] ?: "",
                    enseignementEs = profil.enseignementLibelles["es"] ?: "",
                    structure = selectionStructure.map { (cycle, classes) ->
                        CyclePayload(
                            libelleFr = cycle.libelles["fr"] ?: "",
                            libelleEn = cycle.libelles["en"] ?: "",
                            libelleEs = cycle.libelles["es"] ?: "",
                            classes = classes.map { cl ->
                                ClassePayload(
                                    libelleFr = cl.libelles["fr"] ?: "",
                                    libelleEn = cl.libelles["en"] ?: "",
                                    libelleEs = cl.libelles["es"] ?: "",
                                    abreviation = cl.abreviation
                                )
                            }
                        )
                    }.filter { it.classes.isNotEmpty() }
                )

                // Appel de l'API avec l'unique paramètre requis
                val response = api.sauvegarderStructureDistante(payload = payload)

                if (!response.isSuccessful) {
                    _saveState.value = SaveState.ERROR("Le serveur distant a rejeté l'enregistrement (Code: ${response.code()})")
                    return@launch
                }

                // ─── ÉTAPE 2 : Sauvegarde Locale ───
                _saveState.value = SaveState.SAVING_LOCAL

                val ensId = dao.insertEnseignement(
                    EnseignementEntity(
                        idAnneeScolaire = idAnneeScolaire,
                        enseignementFr = profil.enseignementLibelles["fr"] ?: "",
                        enseignementEn = profil.enseignementLibelles["en"] ?: "",
                        enseignementEs = profil.enseignementLibelles["es"] ?: ""
                    )
                )

                selectionStructure.forEach { (predefinedCycle, classesChoisies) ->
                    if (classesChoisies.isNotEmpty()) {
                        val cycleId = dao.insertCycle(
                            CycleEntity(
                                idAnneeScolaire = idAnneeScolaire,
                                idEnseignementLocal = ensId,
                                libelleCycleFr = predefinedCycle.libelles["fr"] ?: "",
                                libelleCycleEn = predefinedCycle.libelles["en"] ?: "",
                                libelleCycleEs = predefinedCycle.libelles["es"] ?: "",
                                ordre = 1
                            )
                        )

                        val classesEntities = classesChoisies.map { predefinedClasse ->
                            ClasseEntity(
                                idAnneeScolaire = idAnneeScolaire,
                                idCycleLocal = cycleId,
                                libelleClasseFr = predefinedClasse.libelles["fr"] ?: "",
                                libelleClasseEn = predefinedClasse.libelles["en"] ?: "",
                                libelleClasseEs = predefinedClasse.libelles["es"] ?: "",
                                abreviation = predefinedClasse.abreviation
                            )
                        }
                        dao.insertClasses(classesEntities)
                    }
                }

                _saveState.value = SaveState.SUCCESS

            } catch (e: java.net.UnknownHostException) {
                _saveState.value = SaveState.ERROR("Impossible de joindre le serveur. Vérifiez votre connexion Internet.")
            } catch (e: Exception) {
                e.printStackTrace()
                _saveState.value = SaveState.ERROR("Échec du processus : ${e.localizedMessage}")
            }
        }
    }
}