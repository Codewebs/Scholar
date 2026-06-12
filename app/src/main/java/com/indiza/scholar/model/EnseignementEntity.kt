package com.indiza.scholar.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "enseignement")
data class EnseignementEntity(
    @PrimaryKey(autoGenerate = true) val idLocal: Long = 0,
    val idServeur: Long? = null,
    val idAnneeScolaire: Long,
    val abreviation: String? = null,
    val enseignementFr: String,
    val enseignementEn: String? = null,
    val enseignementEs: String? = null
)