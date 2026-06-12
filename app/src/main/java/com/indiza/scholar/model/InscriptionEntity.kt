package com.indiza.scholar.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "inscription")
data class InscriptionEntity(
    @PrimaryKey(autoGenerate = true) val idLocal: Long = 0,
    val idServeur: Long? = null,
    val idEleveLocal: Long,
    val idEleveServeur: Long?,
    val idAnneeScolaire: Long,
    val idSalle: Long,
    val dateInscription: String,
    val codeInscription: String? = null,
    val statut: String = "INSCRIT",
    val ancienEtablissement: String?,
    val nouveau: Boolean = true,
    val pendingSync: Boolean = false
)
