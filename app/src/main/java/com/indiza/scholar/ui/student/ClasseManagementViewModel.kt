package com.indiza.scholar.ui.student

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.model.ClasseEntity
import com.indiza.scholar.model.ClasseUiModel
import com.indiza.scholar.model.CycleEntity
import com.indiza.scholar.network.ApiService
import kotlinx.coroutines.async
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class ClasseManagementViewModel(private val api: ApiService) : ViewModel() {
    private val _classes = MutableStateFlow<List<ClasseUiModel>>(emptyList())
    val classes: StateFlow<List<ClasseUiModel>> = _classes.asStateFlow()

    private val _cycles = MutableStateFlow<List<CycleEntity>>(emptyList())
    val cycles: StateFlow<List<CycleEntity>> = _cycles.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _syncEvents = MutableSharedFlow<String>()
    val syncEvents: SharedFlow<String> = _syncEvents.asSharedFlow()

    fun loadData(idAnneeScolaire: Long) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                // 🚀 On lance les deux requêtes en parallèle grâce à async
                val cyclesDeferred = async { api.getCyclesByAnnee(idAnneeScolaire) }
                val classesDeferred = async { api.getClassesWithRoomStats(idAnneeScolaire) }

                // On attend le résultat des deux requêtes indépendamment
                val cycleResponse = cyclesDeferred.await()
                val classResponse = classesDeferred.await()

                if (cycleResponse.isSuccessful) {
                    _cycles.value = cycleResponse.body() ?: emptyList()
                } else {
                    Log.e("Scholar_Debug", "Erreur cycles: ${cycleResponse.errorBody()?.string()}")
                }

                if (classResponse.isSuccessful) {
                    _classes.value = classResponse.body() ?: emptyList()
                } else {
                    Log.e("Scholar_Debug", "Erreur classes: ${classResponse.errorBody()?.string()}")
                }

            } catch (e: Exception) {
                Log.e("Scholar_Debug", "Erreur réseau loadData: ${e.localizedMessage}")
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun createClasse(classe: ClasseEntity, idAnneeScolaire: Long) {
        viewModelScope.launch {
            _syncEvents.emit("Création de la classe sur le serveur...")
            try {
                val response = api.createClasse(classe)
                if (response.isSuccessful) {
                    _syncEvents.emit("✅ Classe créée sur le serveur. Mise à jour de l'affichage...")
                    loadData(idAnneeScolaire)
                } else {
                    _syncEvents.emit("❌ Échec de la création distante.")
                }
            } catch (e: Exception) {
                _syncEvents.emit("⚠️ Erreur réseau : Impossible de créer la classe.")
            }
        }
    }

    fun updateClasse(id: Long, classe: ClasseEntity, idAnneeScolaire: Long) {
        viewModelScope.launch {
            _syncEvents.emit("Mise à jour de la classe sur le serveur...")
            try {
                val response = api.updateClasse(id, classe)
                if (response.isSuccessful) {
                    _syncEvents.emit("✅ Classe modifiée sur le serveur.")
                    loadData(idAnneeScolaire)
                } else {
                    _syncEvents.emit("❌ Échec de la modification distante.")
                }
            } catch (e: Exception) {
                _syncEvents.emit("⚠️ Erreur réseau.")
            }
        }
    }

    fun createSalle(salle: com.indiza.scholar.model.SalleEntity, idAnneeScolaire: Long) {
        viewModelScope.launch {
            _syncEvents.emit("Création de la salle sur le serveur...")
            try {
                val response = api.createSalle(salle)
                if (response.isSuccessful) {
                    _syncEvents.emit("✅ Salle créée sur le serveur. Synchronisation...")
                    loadData(idAnneeScolaire)
                } else {
                    _syncEvents.emit("❌ Erreur serveur lors de la création de la salle.")
                }
            } catch (e: Exception) {
                Log.e("Scholar_Debug", "Erreur création salle: ${e.localizedMessage}")
                _syncEvents.emit("⚠️ Échec réseau.")
            }
        }
    }

    // --- Finance ---
    private val _recouvrementStats = MutableStateFlow<com.indiza.scholar.model.RecouvrementStatsResponse?>(null)
    val recouvrementStats: StateFlow<com.indiza.scholar.model.RecouvrementStatsResponse?> = _recouvrementStats.asStateFlow()

    fun loadRecouvrementStats(idClasse: Long, idAnneeScolaire: Long) {
        viewModelScope.launch {
            try {
                val response = api.getRecouvrementStats(idClasse, idAnneeScolaire)
                if (response.isSuccessful) {
                    _recouvrementStats.value = response.body()
                }
            } catch (e: Exception) {}
        }
    }

    // --- Library CRUD ---
    private val _fraisLibrary = MutableStateFlow<List<com.indiza.scholar.model.FraisExigibleEntity>>(emptyList())
    val fraisLibrary: StateFlow<List<com.indiza.scholar.model.FraisExigibleEntity>> = _fraisLibrary.asStateFlow()

    private val _periscolaireLibrary = MutableStateFlow<List<com.indiza.scholar.model.FraisPeriscolaireEntity>>(emptyList())
    val periscolaireLibrary: StateFlow<List<com.indiza.scholar.model.FraisPeriscolaireEntity>> = _periscolaireLibrary.asStateFlow()

    fun loadFraisLibrary() {
        viewModelScope.launch {
            try {
                val response = api.getFraisExigiblesLibrary()
                if (response.isSuccessful) _fraisLibrary.value = response.body() ?: emptyList()
            } catch (e: Exception) {}
        }
    }

    fun loadPeriscolaireLibrary() {
        viewModelScope.launch {
            try {
                val response = api.getFraisPeriscolairesLibrary()
                if (response.isSuccessful) _periscolaireLibrary.value = response.body() ?: emptyList()
            } catch (e: Exception) {}
        }
    }

    fun createLibraryFrais(frais: com.indiza.scholar.model.FraisExigibleEntity) {
        viewModelScope.launch {
            try {
                val response = api.createFraisExigible(frais)
                if (response.isSuccessful) loadFraisLibrary()
            } catch (e: Exception) {}
        }
    }

    fun createPeriscolaireLibraryFrais(frais: com.indiza.scholar.model.FraisPeriscolaireEntity) {
        viewModelScope.launch {
            try {
                val response = api.createFraisPeriscolaire(frais)
                if (response.isSuccessful) loadPeriscolaireLibrary()
            } catch (e: Exception) {}
        }
    }

    fun deleteLibraryFrais(id: Long) {
        viewModelScope.launch {
            try {
                val response = api.deleteFraisExigible(id)
                if (response.isSuccessful) loadFraisLibrary()
            } catch (e: Exception) {}
        }
    }

    fun deletePeriscolaireLibraryFrais(id: Long) {
        viewModelScope.launch {
            try {
                val response = api.deleteFraisPeriscolaire(id)
                if (response.isSuccessful) loadPeriscolaireLibrary()
            } catch (e: Exception) {}
        }
    }

    // --- Classe Tarifs CRUD ---
    private val _currentClassTarifs = MutableStateFlow<List<com.indiza.scholar.model.TarifFraisEntity>>(emptyList())
    val currentClassTarifs: StateFlow<List<com.indiza.scholar.model.TarifFraisEntity>> = _currentClassTarifs.asStateFlow()

    fun loadTarifsByClasse(idClasse: Long, idAnneeScolaire: Long) {
        viewModelScope.launch {
            try {
                val response = api.getTarifsByClasse(idClasse, idAnneeScolaire)
                if (response.isSuccessful) _currentClassTarifs.value = response.body() ?: emptyList()
            } catch (e: Exception) {}
        }
    }

    fun saveClassTarifs(payload: com.indiza.scholar.model.SaveTarifsPayload, onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                val response = api.saveTarifs(payload)
                if (response.isSuccessful) {
                    loadData(payload.idAnneeScolaire)
                    onSuccess()
                }
            } catch (e: Exception) {}
        }
    }

    // --- Bulk Apply ---
    private val _missingClasses = MutableStateFlow<List<com.indiza.scholar.model.ClassMissingFrais>>(emptyList())
    val missingClasses: StateFlow<List<com.indiza.scholar.model.ClassMissingFrais>> = _missingClasses.asStateFlow()

    fun loadClassesMissingFrais(idFrais: Long, idAnneeScolaire: Long) {
        viewModelScope.launch {
            try {
                val response = api.getClassesMissingFrais(idFrais, idAnneeScolaire)
                if (response.isSuccessful) _missingClasses.value = response.body() ?: emptyList()
            } catch (e: Exception) {}
        }
    }

    fun bulkApplyTarif(payload: com.indiza.scholar.model.BulkApplyPayload, onSuccess: () -> Unit) {
        viewModelScope.launch {
            try {
                val response = api.bulkApplyTarif(payload)
                if (response.isSuccessful) {
                    loadData(payload.idAnneeScolaire)
                    onSuccess()
                }
            } catch (e: Exception) {}
        }
    }

    // --- Sequences ---
    private val _sequences = MutableStateFlow<List<com.indiza.scholar.model.SousPeriodeEntity>>(emptyList())
    val sequences: StateFlow<List<com.indiza.scholar.model.SousPeriodeEntity>> = _sequences.asStateFlow()

    fun loadSequencesForClass(idAnneeScolaire: Long, idClasse: Long) {
        viewModelScope.launch {
            try {
                val response = api.getSequenceRepartition(idAnneeScolaire, idClasse)
                if (response.isSuccessful) {
                    _sequences.value = response.body()?.map {
                        it.detailsSousPeriode ?: com.indiza.scholar.model.SousPeriodeEntity(
                            libelleSousPeriodeFr = "SEQ ${it.idSousPeriode}",
                            abrevLibelleFr = "SEQ ${it.idSousPeriode}",
                            dateDebut = "",
                            dateFin = ""
                        )
                    } ?: emptyList()
                }
            } catch (e: Exception) {}
        }
    }
}
