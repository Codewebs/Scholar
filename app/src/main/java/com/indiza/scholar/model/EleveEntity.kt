package com.indiza.scholar.model

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "eleve")
data class EleveEntity(
    @PrimaryKey(autoGenerate = true) val idLocal: Long = 0,
    val idServeur: Long? = null,
    val matricule: String?,
    val nom: String,
    val prenom: String?,
    val dateNaissance: String,
    val lieuNaissance: String,
    val sexe: String,
    val nomPere: String?,
    val telephonePere: Long?,
    val nomMere: String?,
    val telephoneMere: Long?,
    val nomTuteur: String?,
    val telephoneTuteur: Long?,
    val quartier: String?,
    val pendingSync: Boolean = false
)
