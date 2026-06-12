package com.indiza.scholar.network

data class EtablissementDto(
    val idEtablissement: Long?,
    val abreviation: String?,
    val adresse: String?,
    val arrete: String?,
    val description: String?,
    val devise: String?,
    val deviseEn: String?,
    val deviseFr: String?,
    val email: String?,
    val fax: Long?,
    val logo: String?,
    val nomEn: String?,
    val nomFr: String,
    val numBp: Int?,
    val sise: String?,
    val siteWeb: String?,
    val telephone1: Long,
    val telephone2: Long?,
    val telephone3: Long?,
    val ville: String?
)