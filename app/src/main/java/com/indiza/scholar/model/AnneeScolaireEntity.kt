package com.indiza.scholar.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.squareup.moshi.Json

@Entity(tableName = "annee_scolaire")
data class AnneeScolaireEntity(
    @PrimaryKey(autoGenerate = true) val idLocal: Long = 0,
    @Json(name = "idAnneeScolaire") val idServeur: Long? = null,
    val libelleAnneeScolaire: String,
    val dateDebut: String,
    val dateFin: String,
    @Json(name = "idEtablissement") val idEtablissement: Long? = null,
    val cloturerAnnee: Boolean = false
)


fun AnneeScolaireEntity.toDto(): AnneeScolaireDto = AnneeScolaireDto(
    idAnneeScolaire = idServeur,
    libelleAnneeScolaire = libelleAnneeScolaire,
    dateDebut = dateDebut,
    dateFin = dateFin,
    idEtablissement = idEtablissement,
    cloturerAnnee = cloturerAnnee
)

fun AnneeScolaireDto.toEntity(): AnneeScolaireEntity = AnneeScolaireEntity(
    idServeur = idAnneeScolaire,
    libelleAnneeScolaire = libelleAnneeScolaire,
    dateDebut = dateDebut,
    dateFin = dateFin,
    idEtablissement = idEtablissement,
    cloturerAnnee = cloturerAnnee
)

data class AnneeScolaireDto(
    @Json(name = "idAnneeScolaire") val idAnneeScolaire: Long?,
    val libelleAnneeScolaire: String,
    val dateDebut: String,
    val dateFin: String,
    @Json(name = "idEtablissement") val idEtablissement: Long?,
    val cloturerAnnee: Boolean
)

// Dans le package network
data class AnneeScolaireResponse(
    @Json(name = "idAnneeScolaire") val id: Long,
    val libelleAnneeScolaire: String,
    val dateDebut: String,
    val dateFin: String,
    val cloturerAnnee: Boolean
)
