package com.indiza.scholar.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.squareup.moshi.Json

@Entity(tableName = "etablissement")
data class EtablissementEntity(
    @PrimaryKey(autoGenerate = true) val idLocal: Long = 0,
    @Json(name = "idEtablissement") val idServeur: Long? = null,
    val abreviation: String? = null,
    val adresse: String? = null,
    val arrete: String? = null,
    val description: String? = null,
    val devise: String? = null,
    val deviseEn: String? = null,
    val deviseFr: String? = null,
    val email: String? = null,
    val fax: Long? = null,
    val logo: String? = null,
    val nomEn: String? = null,
    val nomFr: String = "",
    val numBp: Int? = null,
    val sise: String? = null,
    val siteWeb: String? = null,
    val telephone1: Long = 0L,
    val telephone2: Long? = null,
    val telephone3: Long? = null,
    val ville: String? = null,
    val pays: String? = null,
    val codeRecrutement: String? = "1234",
    val codeInscription: String? = null,
    val idCreateur: Long? = null,
    val pinSecurite: String? = null,
    val pendingSync: Boolean = false
)