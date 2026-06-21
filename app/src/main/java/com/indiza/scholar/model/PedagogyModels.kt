package com.indiza.scholar.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.squareup.moshi.Json

@Entity(tableName = "matiere")
data class MatiereEntity(
    @PrimaryKey(autoGenerate = true) val idLocal: Long = 0,
    @Json(name = "idMatiere") val idServeur: Long? = null,
    val libelleFr: String,
    val libelleEn: String?,
    val libelleEs: String?,
    val abreviation: String?,
    val supprimer: Boolean = false,
    val pendingSync: Boolean = false
)

@Entity(tableName = "groupe_matiere")
data class GroupeMatiereEntity(
    @PrimaryKey(autoGenerate = true) val idLocal: Long = 0,
    @Json(name = "idGroupeMatiere") val idServeur: Long? = null,
    val libelleFr: String,
    val libelleEn: String?,
    val libelleEs: String?,
    val ordre: Int = 1,
    val idEtablissement: Long? = null
)

@Entity(tableName = "periode")
data class PeriodeEntity(
    @PrimaryKey(autoGenerate = true) val idLocal: Long = 0,
    @Json(name = "idPeriode") val idServeur: Long? = null,
    val libellePeriodeFr: String,
    val libellePeriodeEn: String? = null,
    val libellePeriodeEs: String? = null,
    val abrevLibelleFr: String,
    val abrevLibelleEn: String? = null,
    val abrevLibelleEs: String? = null,
    val dateDebut: String, // Format AAAA-MM-JJ
    val dateFin: String,
    val idAnneeScolaire: Long,
    val ordrePeriode: Int = 1,
    val active: Boolean = false
) {
    @androidx.room.Ignore
    @Json(name = "sousPeriodes")
    var sousPeriodes: List<SousPeriodeEntity> = emptyList()
}

@Entity(tableName = "sous_periode")
data class SousPeriodeEntity(
    @PrimaryKey(autoGenerate = true) val idLocal: Long = 0,
    @Json(name = "idSousPeriode") val idServeur: Long? = null,
    val idPeriodeLocal: Long? = null,
    @Json(name = "idPeriode") val idPeriodeServeur: Long? = null,
    val libelleSousPeriodeFr: String,
    val libelleSousPeriodeEn: String? = null,
    val libelleSousPeriodeEs: String? = null,
    val abrevLibelleFr: String,
    val abrevLibelleEn: String? = null,
    val abrevLibelleEs: String? = null,
    val dateDebut: String,
    val dateFin: String,
    val ordreSousPeriode: Int = 1
)

data class RepartitionMatierePayload(
    val idAnneeScolaire: Long,
    val idClasse: Long,
    val idMatiere: Long,
    val idGroupeMatiere: Long?,
    val coef: Int,
    val noteSur: Int,
    val ordreMatiere: Int
)

data class CompetenceEntity(
    @Json(name = "idCompetence") val idServeur: Long?,
    val libelle: String
)

data class NoteUiModel(
    val idInscription: Long,
    val idEleve: Long,
    val nomComplet: String,
    val matricule: String?,
    var note: Double?,
    var cote: String?,
    var appreciation: String?,
    val idNote: Long?,
    val idCompetence: Long? = null,
    val idRepartitionCompetence: Long? = null,
    var nonClasse: Boolean = false,
    var idJustification: Long? = null,
    var isDirty: Boolean = false
)

data class SaveNotesPayload(
    val notes: List<NoteUiModel>,
    val idRepartitionMatiere: Long,
    val idSequence: Long,
    val idAnneeScolaire: Long,
    val modeSaisie: String // DECIMAL or ALPHABETIC
)

data class BulkActionNotesPayload(
    val action: String, // SET_GLOBAL_NOTE, RESET_MATIERE, NON_COMPOSE_GLOBAL
    val idsInscription: List<Long>,
    val idRepartitionMatiere: Long,
    val idSequence: Long,
    val idAnneeScolaire: Long,
    val value: String? = null,
    val idJustification: Long? = null
)

data class ProgressUiModel(
    val percentage: Float,
    val filled: Int,
    val total: Int
)

data class AbsenceUiModel(
    val idInscription: Long,
    val nomComplet: String,
    val matricule: String?,
    var heuresAJ: Int,
    var heuresANJ: Int,
    val idSuiviAbsence: Long?
)

data class SaveAbsencesPayload(
    val absences: List<AbsenceUiModel>,
    val idSequence: Long,
    val idAnneeScolaire: Long
)

data class PVResponse(
    val message: String
)

data class StudentNoteUiModel(
    val idRepartitionMatiere: Long,
    val matiereLabel: String,
    val matiereAbrev: String?,
    val coef: Int,
    val noteSur: Int = 20,
    var note: Double?,
    var cote: String?,
    val idNote: Long?,
    val idCompetence: Long? = null,
    val idRepartitionCompetence: Long? = null,
    var nonClasse: Boolean = false,
    var idJustification: Long? = null,
    var isDirty: Boolean = false
)

data class SaveStudentNotesPayload(
    val notes: List<StudentNoteUiModel>,
    val idInscription: Long,
    val idSequence: Long,
    val idAnneeScolaire: Long,
    val modeSaisie: String
)

data class JustificationEntity(
    @Json(name = "idJustification") val idServeur: Long,
    val libelleJustificationFr: String,
    val libelleJustificationEn: String?,
    val description: String?
)

@Entity(tableName = "repartition_sous_periode")
data class RepartitionSousPeriodeEntity(
    @PrimaryKey(autoGenerate = true) val idLocal: Long = 0,
    @Json(name = "idRepartitionSousPeriode") val idServeur: Long? = null,
    val idClasse: Long,
    val idSousPeriode: Long,
    val idAnneeScolaire: Long,
    val supprimer: Boolean = false,
    @Json(name = "SousPeriode") val detailsSousPeriode: SousPeriodeEntity? = null
)

data class SequenceRepartitionPayload(
    val idAnneeScolaire: Long,
    val classIds: List<Long>,
    val sequenceIds: List<Long>
)
