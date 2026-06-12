package com.indiza.scholar.model

import androidx.room.Entity
import androidx.room.PrimaryKey

import com.squareup.moshi.Json

@Entity(tableName = "cyclee")
data class CycleEntity(
    @PrimaryKey(autoGenerate = true) val idLocal: Long = 0,
    @Json(name = "idCycle") val idServeur: Long? = null,
    val idAnneeScolaire: Long,
    val idEnseignementLocal: Long? = null,
    val libelleCycleFr: String,
    val libelleCycleEn: String,
    val libelleCycleEs: String,
    val abreviation: String? = null,

    val ordre: Int = 1
)