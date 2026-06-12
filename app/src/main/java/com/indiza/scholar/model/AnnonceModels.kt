package com.indiza.scholar.model

import com.squareup.moshi.Json

enum class AnnonceType {
    COMMUNAUTAIRE,
    PUBLIQUE
}

data class AnnonceEntity(
    val idLocal: Long = 0,
    @Json(name = "idAnnonce") val idServeur: Long? = null,
    val titre: String? = null,
    val contenu: String,
    val image: String? = null,
    val type: AnnonceType,
    val datePublication: String,
    val idAuteur: Long,
    val nomAuteur: String,
    val posteAuteur: String? = null,
    val idEtablissement: Long,
    val nomEtablissement: String? = null,
    val villeEtablissement: String? = null,
    val paysEtablissement: String? = null
)
