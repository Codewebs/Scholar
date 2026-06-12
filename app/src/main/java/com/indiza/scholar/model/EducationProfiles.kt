package com.indiza.scholar.model

data class PredefinedClasse(
    val idClasse: Long,
    val libelles: Map<String, String>,
    val abreviation: String
)

data class PredefinedCycle(
    val idCycle: Long,
    val libelles: Map<String, String>,
    val classes: List<PredefinedClasse>
)

data class PredefinedProfil(
    val idEnseignement: Long,
    val nomProfil: String,
    val enseignementLibelles: Map<String, String>,
    val cycles: List<PredefinedCycle>
)

data class PredefinedCountry(
    val idCountry: Long,
    val nomPays: String,
    val profils: List<PredefinedProfil>
)
