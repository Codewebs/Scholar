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

    private val _repartitions = MutableStateFlow<List<RepartitionMatiereEntity>>(emptyList())
    val repartitions: StateFlow<List<RepartitionMatiereEntity>> = _repartitions

    private val _justifications = MutableStateFlow<List<JustificationEntity>>(emptyList())
    val justifications: StateFlow<List<JustificationEntity>> = _justifications

    private val _hasChanges = MutableStateFlow(false)
    val hasChanges = _hasChanges.asStateFlow()

    private val _salleProgress = MutableStateFlow<ProgressUiModel?>(null)
    val salleProgress = _salleProgress.asStateFlow()

    private val _matiereProgress = MutableStateFlow<ProgressUiModel?>(null)
    val matiereProgress = _matiereProgress.asStateFlow()

    private val _studentProgress = MutableStateFlow<ProgressUiModel?>(null)
    val studentProgress = _studentProgress.asStateFlow()

    fun loadSallesWithProgress(idAnnee: Long, idSeq: Long) {
        viewModelScope.launch {
            try {
                val res = api.getSallesByAnnee(idAnnee)
                if (res.isSuccessful) {
                    val list = res.body() ?: emptyList()
                    list.forEach { salle ->
                        val pRes = api.getSalleProgress(salle.idServeur ?: 0L, idSeq, idAnnee)
                        if (pRes.isSuccessful) {
                            salle.progress = pRes.body()?.percentage ?: 0f
                        }
                    }
                    _salles.value = emptyList()
                    _salles.value = list
                }
            } catch (e: Exception) { e.printStackTrace() }
        }
    }

    fun loadInitialData(idAnnee: Long) {
        viewModelScope.launch {
            try {
                val sRes = api.getSallesByAnnee(idAnnee)
                if (sRes.isSuccessful) _salles.value = sRes.body() ?: emptyList()
                
                val pRes = api.getPeriodesByAnnee(idAnnee)
                if (pRes.isSuccessful) {
                    val allSequences = pRes.body()?.flatMap { it.sousPeriodes } ?: emptyList()
                    _sequences.value = allSequences
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
                val res = api.getRepartitionByAnnee(idAnnee, idClasse)
                if (res.isSuccessful) {
                    val list = res.body() ?: emptyList()
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
            try {
                val response = api.getNotesByMatiere(idSalle, idRepartition, idSequence, idAnnee)
                if (response.isSuccessful) {
                    _notes.value = response.body() ?: emptyList()
                    _hasChanges.value = false
                    loadMatiereProgress(idSalle, idRepartition, idSequence, idAnnee)
                }
            } catch (e: Exception) {
                e.printStackTrace()
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
                    onComplete()
                    return@launch
                }
                val payload = SaveNotesPayload(dirtyNotes, idRepartition, idSequence, idAnnee, mode)
                api.saveNotes(payload)
                _notes.value = _notes.value.map { it.copy(isDirty = false) }
                _hasChanges.value = false
                onComplete()
                loadMatiereProgress(0, idRepartition, idSequence, idAnnee)
            } catch (e: Exception) {
                e.printStackTrace()
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

    fun updateNoteLocally(index: Int, newNote: Double?, newCote: String?) {
        val currentList = _notes.value.toMutableList()
        if (index in currentList.indices) {
            currentList[index] = currentList[index].copy(note = newNote, cote = newCote, isDirty = true)
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

    fun updateStudentNoteLocally(index: Int, newNote: Double?, newCote: String?) {
        val currentList = _studentNotes.value.toMutableList()
        if (index in currentList.indices) {
            currentList[index] = currentList[index].copy(note = newNote, cote = newCote, isDirty = true)
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
