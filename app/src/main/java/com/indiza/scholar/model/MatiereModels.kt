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
    var progress: Float = 0f,
    @Json(name = "Matiere") val detailsMatiere: MatiereEntity? = null,
    @Json(name = "Classe") val detailsClasse: ClasseResponse? = null
)
