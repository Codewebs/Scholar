package com.indiza.scholar.model

data class StudentRegistrationPayload(
    val matricule: String?, // Si null, généré par le backend
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


    val idAnneeScolaire: Long,
    val idSalle: Long,
    val ancienEtablissement: String?,
    val quartier: String?,
    val nouveau: Boolean
)


data class PaymentPayload(
    val idInscription: Long,
    val idModePaiement: Long,
    val idAnneeScolaire: Long,

    val ventilations: List<VentilationFraisPayload>
)

data class VentilationFraisPayload(
    val idFraisExigibleCopier: Long,
    val montantAlloue: Int
)