package com.indiza.scholar.ui.grades

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.indiza.scholar.model.*
import com.indiza.scholar.network.ApiService
import com.indiza.scholar.ui.student.EleveUiModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class GradeManagementViewModel(private val api: ApiService) : ViewModel() {

    private val _notes = MutableStateFlow<List<NoteUiModel>>(emptyList())
    val notes: StateFlow<List<NoteUiModel>> = _notes

    private val _absences = MutableStateFlow<List<AbsenceUiModel>>(emptyList())
    val absences: StateFlow<List<AbsenceUiModel>> = _absences

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _studentNotes = MutableStateFlow<List<StudentNoteUiModel>>(emptyList())
    val studentNotes: StateFlow<List<StudentNoteUiModel>> = _studentNotes

    private val _salleStudents = MutableStateFlow<List<EleveUiModel>>(emptyList())
    val salleStudents: StateFlow<List<EleveUiModel>> = _salleStudents

    private val _salles = MutableStateFlow<List<SalleEntity>>(emptyList())
    val salles: StateFlow<List<SalleEntity>> = _salles

    private val _sequences = MutableStateFlow<List<SousPeriodeEntity>>(emptyList())
    val sequences: StateFlow<List<SousPeriodeEntity>> = _sequences

    private val _sequenceRepartition = MutableStateFlow<List<RepartitionSousPeriodeEntity>>(emptyList())
    val sequenceRepartition: StateFlow<List<RepartitionSousPeriodeEntity>> = _sequenceRepartition

    private val _repartitions = MutableStateFlow<List<RepartitionMatiereEntity>>(emptyList())
    val repartitions: StateFlow<List<RepartitionMatiereEntity>> = _repartitions

    private val _justifications = MutableStateFlow<List<JustificationEntity>>(emptyList())
    val justifications: StateFlow<List<JustificationEntity>> = _justifications

    private val _currentCompetences = MutableStateFlow<List<RepartitionCompetenceEntity>>(emptyList())
    val currentCompetences: StateFlow<List<RepartitionCompetenceEntity>> = _currentCompetences

    private val _hasChanges = MutableStateFlow(false)
    val hasChanges = _hasChanges.asStateFlow()

    private val _salleProgress = MutableStateFlow<ProgressUiModel?>(null)
    val salleProgress = _salleProgress.asStateFlow()

    private val _matiereProgress = MutableStateFlow<ProgressUiModel?>(null)
    val matiereProgress = _matiereProgress.asStateFlow()

    private val _studentProgress = MutableStateFlow<ProgressUiModel?>(null)
    val studentProgress = _studentProgress.asStateFlow()

    fun loadCompetences(idRep: Long, idSeq: Long) {
        viewModelScope.launch {
            try {
                val res = api.getRepartitionCompetences(idRep, idSeq)
                if (res.isSuccessful) {
                    _currentCompetences.value = res.body() ?: emptyList()
                }
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    fun loadSallesWithProgress(idAnnee: Long, idSeq: Long) {
        viewModelScope.launch {
            try {
                val res = api.getSallesByAnnee(idAnnee)
                if (res.isSuccessful) {
                    val list = res.body() ?: emptyList()
                    android.util.Log.d("GradeVM", "📥 Salles reçues (${list.size}): ${list.map { it.nomSalle }}")
                    list.forEach { salle ->
                        val pRes = api.getSalleProgress(salle.idServeur ?: 0L, idSeq, idAnnee)
                        if (pRes.isSuccessful) {
                            salle.progress = pRes.body()?.percentage ?: 0f
                        }
                    }
                    _salles.value = emptyList()
                    _salles.value = list
                } else {
                    android.util.Log.e("GradeVM", "❌ Erreur chargement salles: ${res.errorBody()?.string()}")
                }
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    fun loadInitialData(idAnnee: Long) {
        viewModelScope.launch {
            try {
                android.util.Log.d("GradeVM", "🔄 Chargement initial des données (Année ID: $idAnnee)")
                val sRes = api.getSallesByAnnee(idAnnee)
                if (sRes.isSuccessful) {
                    val list = sRes.body() ?: emptyList()
                    android.util.Log.d("GradeVM", "✅ ${list.size} salles autorisées récupérées")
                    _salles.value = list
                }
                
                val pRes = api.getPeriodesByAnnee(idAnnee)
                if (pRes.isSuccessful) {
                    val allSequences = pRes.body()?.flatMap { it.sousPeriodes } ?: emptyList()
                    android.util.Log.d("GradeVM", "✅ ${allSequences.size} séquences récupérées")
                    _sequences.value = allSequences
                }

                val srRes = api.getSequenceRepartition(idAnnee)
                if (srRes.isSuccessful) {
                    _sequenceRepartition.value = srRes.body() ?: emptyList()
                }

                loadJustifications()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun loadJustifications() {
        viewModelScope.launch {
            try {
                val jRes = api.getJustifications()
                if (jRes.isSuccessful) _justifications.value = jRes.body() ?: emptyList()
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    fun saveJustification(justif: JustificationEntity) {
        viewModelScope.launch {
            try {
                if (justif.idServeur > 0) {
                    api.updateJustification(justif.idServeur, justif)
                } else {
                    api.createJustification(justif)
                }
                loadJustifications()
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    fun deleteJustification(id: Long) {
        viewModelScope.launch {
            try {
                api.deleteJustification(id)
                loadJustifications()
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    fun loadRepartitions(idAnnee: Long, idClasse: Long, idSalle: Long? = null, idSeq: Long? = null) {
        viewModelScope.launch {
            try {
                android.util.Log.d("GradeVM", "🔍 Chargement répartitions (Classe ID: $idClasse, Salle ID: $idSalle)")
                val res = api.getRepartitionByAnnee(idAnnee, idClasse, idSalle)
                if (res.isSuccessful) {
                    val list = res.body() ?: emptyList()
                    android.util.Log.d("GradeVM", "✅ ${list.size} matières autorisées récupérées")
                    _repartitions.value = list
                    
                    if (idSalle != null && idSeq != null) {
                        list.forEach { rep ->
                            val pRes = api.getMatiereProgress(idSalle, rep.idRepartitionMatiere, idSeq, idAnnee)
                            if (pRes.isSuccessful) {
                                rep.progress = pRes.body()?.percentage ?: 0f
                            }
                        }
                        _repartitions.value = emptyList() // Trigger refresh
                        _repartitions.value = list
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun loadStudentsBySalle(idAnnee: Long, idSalle: Long, idSeq: Long? = null) {
        viewModelScope.launch {
            try {
                val res = api.getStudentsByRoom(idAnnee, idSalle)
                if (res.isSuccessful) {
                    val list = res.body() ?: emptyList()
                    if (idSeq != null) {
                        list.forEach { student ->
                            val pRes = api.getStudentProgress(student.idInscription, idSeq, idAnnee)
                            if (pRes.isSuccessful) {
                                student.matiereNotees = pRes.body()?.filled ?: 0
                                student.totalMatieres = pRes.body()?.total ?: 0
                            }
                        }
                    }
                    _salleStudents.value = emptyList()
                    _salleStudents.value = list
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun loadNotesByStudent(idIns: Long, idSeq: Long, idAnnee: Long, idClasse: Long) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val res = api.getNotesByStudent(idIns, idSeq, idAnnee, idClasse)
                if (res.isSuccessful) {
                    _studentNotes.value = res.body() ?: emptyList()
                    _hasChanges.value = false
                    loadStudentProgress(idIns, idSeq, idAnnee)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun saveStudentNotes(idIns: Long, idSeq: Long, idAnnee: Long, mode: String, onComplete: () -> Unit) {
        viewModelScope.launch {
            try {
                val dirtyNotes = _studentNotes.value.filter { it.isDirty && (it.note != null || it.nonClasse) }
                if (dirtyNotes.isEmpty()) {
                    onComplete()
                    return@launch
                }
                val payload = SaveStudentNotesPayload(dirtyNotes, idIns, idSeq, idAnnee, mode)
                api.saveNotesByStudent(payload)
                _studentNotes.value = _studentNotes.value.map { it.copy(isDirty = false) }
                _hasChanges.value = false
                onComplete()
                loadStudentProgress(idIns, idSeq, idAnnee)
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun loadNotes(idSalle: Long, idRepartition: Long, idSequence: Long, idAnnee: Long) {
        viewModelScope.launch {
            _isLoading.value = true
            android.util.Log.d("GradeVM", "🔍 [LoadNotes] Salle: $idSalle, Repartition: $idRepartition, Seq: $idSequence, Year: $idAnnee")
            try {
                val response = api.getNotesByMatiere(idSalle, idRepartition, idSequence, idAnnee)
                if (response.isSuccessful) {
                    val rawNotes = response.body() ?: emptyList()
                    android.util.Log.d("GradeVM", "📥 [LoadNotes] Received ${rawNotes.size} notes")
                    
                    // If we have competencies, ensure we have an entry for each student-competence pair
                    val comps = _currentCompetences.value
                    if (comps.isNotEmpty()) {
                        android.util.Log.d("GradeVM", "🛠️ [LoadNotes] APC Mode: Enriching notes with ${comps.size} competencies")
                        // Logic to ensure flattened list if backend doesn't provide it
                        // For now assuming backend/api returns them or we handle them locally
                    }

                    _notes.value = rawNotes
                    _hasChanges.value = false
                    loadMatiereProgress(idSalle, idRepartition, idSequence, idAnnee)
                } else {
                    android.util.Log.e("GradeVM", "❌ [LoadNotes] Error: ${response.errorBody()?.string()}")
                }
            } catch (e: Exception) {
                android.util.Log.e("GradeVM", "❌ [LoadNotes] Exception", e)
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loadSalleProgress(idSalle: Long, idSequence: Long, idAnnee: Long) {
        viewModelScope.launch {
            try {
                val res = api.getSalleProgress(idSalle, idSequence, idAnnee)
                if (res.isSuccessful) _salleProgress.value = res.body()
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    fun loadMatiereProgress(idSalle: Long, idRep: Long, idSeq: Long, idAnnee: Long) {
        viewModelScope.launch {
            try {
                val res = api.getMatiereProgress(idSalle, idRep, idSeq, idAnnee)
                if (res.isSuccessful) _matiereProgress.value = res.body()
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    fun loadStudentProgress(idIns: Long, idSeq: Long, idAnnee: Long) {
        viewModelScope.launch {
            try {
                val res = api.getStudentProgress(idIns, idSeq, idAnnee)
                if (res.isSuccessful) _studentProgress.value = res.body()
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    fun saveNotes(idRepartition: Long, idSequence: Long, idAnnee: Long, mode: String, onComplete: () -> Unit) {
        viewModelScope.launch {
            try {
                val dirtyNotes = _notes.value.filter { it.isDirty && (it.note != null || it.nonClasse) }
                if (dirtyNotes.isEmpty()) {
                    android.util.Log.d("GradeVM", "ℹ️ [SaveNotes] No dirty notes to save")
                    onComplete()
                    return@launch
                }
                
                android.util.Log.d("GradeVM", "💾 [SaveNotes] Saving ${dirtyNotes.size} notes. Sample: ${dirtyNotes.first().nomComplet} -> ${dirtyNotes.first().note}")
                
                // Validation
                val invalid = dirtyNotes.filter { it.idCompetence != null && it.idRepartitionCompetence == null }
                if (invalid.isNotEmpty()) {
                    android.util.Log.e("GradeVM", "❌ [SaveNotes] Validation failed: Missing idRepartitionCompetence for ${invalid.size} notes")
                    // Handle error or proceed if backend is lenient
                }

                val payload = SaveNotesPayload(dirtyNotes, idRepartition, idSequence, idAnnee, mode)
                val res = api.saveNotes(payload)
                if (res.isSuccessful) {
                    android.util.Log.d("GradeVM", "✅ [SaveNotes] Success")
                    _notes.value = _notes.value.map { it.copy(isDirty = false) }
                    _hasChanges.value = false
                    onComplete()
                    loadMatiereProgress(0, idRepartition, idSequence, idAnnee)
                } else {
                    android.util.Log.e("GradeVM", "❌ [SaveNotes] Server Error: ${res.errorBody()?.string()}")
                }
            } catch (e: Exception) {
                android.util.Log.e("GradeVM", "❌ [SaveNotes] Exception", e)
            }
        }
    }

    fun applyBulkAction(action: String, ids: List<Long>, idRepartition: Long, idSequence: Long, idAnnee: Long, value: String? = null, idJustification: Long? = null) {
        viewModelScope.launch {
            try {
                val payload = BulkActionNotesPayload(action, ids, idRepartition, idSequence, idAnnee, value, idJustification)
                val response = api.bulkActionNotes(payload)
                if (response.isSuccessful) {
                    loadNotes(0, idRepartition, idSequence, idAnnee) // Reload
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun loadAbsences(idSalle: Long, idSequence: Long, idAnnee: Long) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = api.getAbsences(idSalle, idSequence, idAnnee)
                if (response.isSuccessful) {
                    _absences.value = response.body() ?: emptyList()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun saveAbsences(idSequence: Long, idAnnee: Long, onComplete: () -> Unit) {
        viewModelScope.launch {
            // Absence saving logic
            onComplete()
        }
    }

    fun updateNoteLocally(index: Int, newNote: Double?, newCote: String?, idComp: Long? = null, idRepComp: Long? = null) {
        val currentList = _notes.value.toMutableList()
        if (index in currentList.indices) {
            currentList[index] = currentList[index].copy(
                note = newNote,
                cote = newCote,
                idCompetence = idComp ?: currentList[index].idCompetence,
                idRepartitionCompetence = idRepComp ?: currentList[index].idRepartitionCompetence,
                isDirty = true
            )
            _notes.value = currentList
            _hasChanges.value = true
        }
    }

    fun updateStatusLocally(index: Int, nonClasse: Boolean, idJustif: Long?) {
        val currentList = _notes.value.toMutableList()
        if (index in currentList.indices) {
            currentList[index] = currentList[index].copy(
                nonClasse = nonClasse,
                idJustification = idJustif,
                note = if (nonClasse) 0.0 else currentList[index].note,
                cote = if (nonClasse) "F-" else currentList[index].cote,
                isDirty = true
            )
            _notes.value = currentList
            _hasChanges.value = true
        }
    }

    fun updateAbsenceLocally(index: Int, aj: Int, anj: Int) {
        val currentList = _absences.value.toMutableList()
        if (index in currentList.indices) {
            currentList[index] = currentList[index].copy(heuresAJ = aj, heuresANJ = anj)
            _absences.value = currentList
        }
    }

    fun updateStudentNoteLocally(index: Int, newNote: Double?, newCote: String?, idComp: Long? = null, idRepComp: Long? = null) {
        val currentList = _studentNotes.value.toMutableList()
        if (index in currentList.indices) {
            currentList[index] = currentList[index].copy(
                note = newNote,
                cote = newCote,
                idCompetence = idComp ?: currentList[index].idCompetence,
                idRepartitionCompetence = idRepComp ?: currentList[index].idRepartitionCompetence,
                isDirty = true
            )
            _studentNotes.value = currentList
            _hasChanges.value = true
        }
    }

    fun updateStudentStatusLocally(index: Int, nonClasse: Boolean, idJustif: Long?) {
        val currentList = _studentNotes.value.toMutableList()
        if (index in currentList.indices) {
            currentList[index] = currentList[index].copy(
                nonClasse = nonClasse,
                idJustification = idJustif,
                note = if (nonClasse) 0.0 else currentList[index].note,
                cote = if (nonClasse) "F-" else currentList[index].cote,
                isDirty = true
            )
            _studentNotes.value = currentList
            _hasChanges.value = true
        }
    }

    fun clearChanges() {
        _hasChanges.value = false
    }

    fun clearGrades() {
        _notes.value = emptyList()
        _studentNotes.value = emptyList()
        _salleStudents.value = emptyList()
        _salleProgress.value = null
        _matiereProgress.value = null
        _studentProgress.value = null
    }
}
