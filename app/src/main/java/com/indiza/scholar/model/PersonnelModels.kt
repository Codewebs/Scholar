package com.indiza.scholar.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.squareup.moshi.Json

@Entity(tableName = "inscription_personnel")
data class InscriptionPersonnelEntity(
    @PrimaryKey(autoGenerate = true) val idLocal: Long = 0,
    @Json(name = "idInscriptionPersonnel") val idServeur: Long? = null,
    val matricule: String,
    val nom: String,
    val prenom: String?,
    val telephone1: Long,
    val role: String,
    val idAnneeScolaire: Long,
    val idEtablissement: Long,
    val bloque: Boolean = false,
    val permissionsAjoutees: List<String>? = emptyList(), // Surcharges "bonus"
    val permissionsRetirees: List<String>? = emptyList(), // Surcharges "malus"
    val specialites: List<MatiereEntity>? = emptyList()
)

data class DemandeInscriptionPayload(
    val idUtilisateur: Long,
    val idEtablissement: Long,
    val profilDemande: String,
    val nom: String,
    val prenom: String,
    val telephone1: Long,
    val email: String?,
    val specialites: String?,
    val permissionsAjoutees: List<String>? = null,
    val permissionsRetirees: List<String>? = null
)

data class ValidationDemandePayload(
    val idDemande: Long,
    val idAnneeScolaire: Long,
    val matricule: String,
    val dateNaissance: String,
    val lieuNaissance: String,
    val sexe: String,
    val role: String? = null,
    val permissionsAjoutees: List<String>? = null,
    val permissionsRetirees: List<String>? = null
)

data class AffectationPayload(
    val idInscriptionPersonnel: Long,
    val idSalle: Long,
    val idMatiere: Long
)

data class AffectationPersonnelSalleResponse(
    val idAffectation: Long,
    val idInscriptionPersonnel: Long,
    val idSalle: Long,
    val idMatiere: Long,
    val nomComplet: String,
    val matiereLabel: String
)

data class UserAssociation(
    val school: EtablissementEntity,
    val idAnneeScolaire: Long = 0L,
    val roles: List<String>,
    val permissionsAjoutees: List<String> = emptyList(),
    val permissionsRetirees: List<String> = emptySet<String>().toList(),
    val etat: String = "VALIDE"
)

data class DemandeInscriptionPersonnel(
    val idDemande: Long,
    val idUtilisateur: Long,
    val idEtablissement: Long,
    val profilDemande: String,
    val nom: String,
    val prenom: String,
    val telephone1: Long,
    val email: String?,
    val dateDemande: String,
    val etat: String,
    val specialites: String?,
    @Json(name = "Utilisateur") val utilisateur: UserMinimal? = null,
    @Json(name = "Etablissement") val etablissement: EtablissementMinimal? = null
)

data class UserMinimal(
    val idUtilisateur: Long? = null,
    val nom: String,
    val identifiant: String
)

data class EtablissementMinimal(
    val nomFr: String,
    val ville: String?
)
