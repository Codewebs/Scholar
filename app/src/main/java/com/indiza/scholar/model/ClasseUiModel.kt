package com.indiza.scholar.model

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class ClasseUiModel(
    val idClasse: Long,
    val libelleClasseFr: String,
    val cycleLabel: String = "",
    val roomCount: Int,
    val abreviation: String? = null,
    val totalEnrolled: Int = 0,
    val totalCapacity: Int = 0,
    val boys: Int = 0,
    val idAnneeScolaire: Long? = null,
    val girls: Int = 0,
    val hasFees: Boolean = false
)
