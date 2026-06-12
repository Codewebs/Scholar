package com.indiza.scholar.model

import com.squareup.moshi.Json

enum class SpecialityType {
    MATIERE,
    COMPETENCE_PRO
}

data class Speciality(
    val id: Long,
    val libelle: String,
    val type: SpecialityType
)
