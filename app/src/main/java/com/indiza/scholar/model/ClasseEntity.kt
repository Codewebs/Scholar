package com.indiza.scholar.model

import androidx.room.Entity
import androidx.room.PrimaryKey

import com.squareup.moshi.Json

@Entity(tableName = "classe")
data class ClasseEntity(
    @PrimaryKey(autoGenerate = true) val idLocal: Long = 0,
    @Json(name = "idClasse") val idServeur: Long? = null,
    val idAnneeScolaire: Long,
    val idCycleLocal: Long,
    @Json(name = "idCycle") val idCycleServeur: Long? = null,
    val libelleClasseFr: String,
    val libelleClasseEs: String,
    val libelleClasseEn: String,
    val abreviation: String? = null
)