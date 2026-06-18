package com.indiza.scholar.model

import com.squareup.moshi.Json

data class MatiereKPIs(
    val totalMatieres: Int,
    val matieresReparties: Int,
    val avgCoef: String,
    val tauxAffectation: Int
)

data class ClassMatiereStat(
    val idClasse: Long,
    val libelle: String,
    val count: Int
)

data class RepartitionMatiereEntity(
    val idRepartitionMatiere: Long,
    val coef: Int,
    val noteSur: Int,
    val ordreMatiere: Int,
    val idAnneeScolaire: Long,
    val idClasse: Long,
    val idMatiere: Long,
    val idGroupeMatiere: Long? = null,
    var progress: Float = 0f,
    @Json(name = "Matiere") val detailsMatiere: MatiereEntity? = null,
    @Json(name = "Classe") val detailsClasse: ClasseResponse? = null
)

data class RepartitionCompetenceEntity(
    val id: Long,
    val idRepartitionMatiere: Long,
    val idCompetence: Long,
    val idSousPeriode: Long,
    @Json(name = "Competence") val detailsCompetence: CompetenceEntity? = null
)

data class TransferSubjectPayload(
    val idAnneeScolaire: Long,
    val idRepartitionMatiere: Long,
    val targetClasseIds: List<Long>,
    val includeCompetences: Boolean
)

data class TransferGroupPayload(
    val idAnneeScolaire: Long,
    val idClasseSource: Long,
    val idGroupeMatiere: Long,
    val targetClasseIds: List<Long>
)

data class SaveRepartitionCompetencePayload(
    val idRepartitionMatiere: Long,
    val idCompetence: Long,
    val idSousPeriodes: List<Long>
)
