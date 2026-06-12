package com.indiza.scholar.model

import androidx.room.Entity
import androidx.room.PrimaryKey

import com.squareup.moshi.Json

@Entity(tableName = "salle_classe")
data class SalleEntity(
    @PrimaryKey(autoGenerate = true) val idLocal: Long = 0,
    @Json(name = "idSalle") val idServeur: Long? = null,
    @Json(name = "idClasse") val idClasseServeur: Long,
    val idAnneeScolaire: Long? = null,
    val nomSalle: String,
    val classeLabel: String? = null, // Ajouté pour l'affichage concaténé
    val capacite: Int? = null,
    val photo: String? = null,
    val elevesInscrits: Int = 0, // Mis à jour depuis le serveur
    var progress: Float = 0f,
    val pendingSync: Boolean = false
)
