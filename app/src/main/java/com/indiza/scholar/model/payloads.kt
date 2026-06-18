package com.indiza.scholar.model

import com.squareup.moshi.Json

data class StructurePayload(
    @Json(name = "idAnneeScolaire") val idAnneeScolaire: Long,
    @Json(name = "selectedEnseignements") val selectedEnseignements: List<Long>? = null,
    @Json(name = "nomPays") val nomPays: String? = null,
    @Json(name = "nomProfil") val nomProfil: String? = null,
    @Json(name = "enseignementFr") val enseignementFr: String? = null,
    @Json(name = "enseignementEn") val enseignementEn: String? = null,
    @Json(name = "enseignementEs") val enseignementEs: String? = null,
    @Json(name = "structure") val structure: List<CyclePayload>? = null
)

data class CyclePayload(
    @Json(name = "libelleFr") val libelleFr: String,
    @Json(name = "libelleEn") val libelleEn: String,
    @Json(name = "libelleEs") val libelleEs: String,
    @Json(name = "classes") val classes: List<ClassePayload>
)

data class ClassePayload(
    @Json(name = "libelleFr") val libelleFr: String,
    @Json(name = "libelleEn") val libelleEn: String,
    @Json(name = "libelleEs") val libelleEs: String,
    @Json(name = "abreviation") val abreviation: String
)

data class EnseignementResponse(
    @Json(name = "idEnseignement") val idEnseignement: Long,
    @Json(name = "idAnneeScolaire") val idAnneeScolaire: Long,
    @Json(name = "enseignementFr") val enseignementFr: String,
    @Json(name = "enseignementEn") val enseignementEn: String?,
    @Json(name = "enseignementEs") val enseignementEs: String?,
    @Json(name = "cycles") val cycles: List<CycleResponse> = emptyList()
)

data class CycleResponse(
    @Json(name = "idCycle") val idCycle: Long,
    @Json(name = "idEnseignement") val idEnseignement: Long,
    @Json(name = "libelleCycleFr") val libelleCycleFr: String,
    @Json(name = "libelleCycleEn") val libelleCycleEn: String?,
    @Json(name = "libelleCycleEs") val libelleCycleEs: String?,
    @Json(name = "ordre") val ordre: Int,
    @Json(name = "classes") val classes: List<ClasseResponse> = emptyList()
)

data class ClasseResponse(
    @Json(name = "idClasse") val idClasse: Long,
    @Json(name = "idCycle") val idCycle: Long,
    @Json(name = "libelleClasseFr") val libelleClasseFr: String,
    @Json(name = "libelleClasseEn") val libelleClasseEn: String?,
    @Json(name = "libelleClasseEs") val libelleClasseEs: String?,
    @Json(name = "abreviation") val abreviation: String?,
    @Json(name = "ordre") val ordre: Int
)

data class CloneProgramPayload(
    val idAnneeScolaire: Long,
    val idClasseSource: Long,
    val targetClasseIds: List<Long>,
    val idAnneeSource: Long? = null
)

data class BulkAssignSubjectPayload(
    val idAnneeScolaire: Long,
    val idMatiere: Long?,
    val assignments: List<SubjectAssignmentItem>
)

data class SubjectAssignmentItem(
    val idMatiere: Long? = null,
    val idClasse: Long,
    val coef: Int,
    val noteSur: Int = 20,
    val ordreMatiere: Int = 1,
    val idGroupeMatiere: Long? = null
)

enum class PdfExportType {
    SIMPLE,  // Sans le Bloc 3 (Uniquement l'en-tête et les notes brutes)
    COMPLET  // Avec toutes les statistiques de fin de tableau et de pied de page
}

data class PvExportPayload(
    val idSalle: Long,
    val idSequence: Long,
    val idAnneeScolaire: Long,
    val anneeScolaire: String,
    val exportType: PdfExportType
)
