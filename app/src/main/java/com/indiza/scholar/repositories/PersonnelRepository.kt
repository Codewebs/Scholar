package com.indiza.scholar.repositories

import com.indiza.scholar.network.ApiService
import com.indiza.scholar.model.*
import retrofit2.Response

class PersonnelRepository(private val api: ApiService) {
    suspend fun getPersonnelActif(idEtablissement: Long, idAnnee: Long): Response<List<InscriptionPersonnelEntity>> {
        // Since we didn't add it to ApiService yet, I'll update it later.
        // For now, let's assume it exists or will be added.
        return api.getPersonnelActif(idEtablissement, idAnnee)
    }

    suspend fun getDemandesEnAttente(idEtablissement: Long): Response<List<DemandeInscriptionPersonnel>> {
        return api.getDemandesEnAttente(idEtablissement)
    }

    suspend fun envoyerDemande(payload: DemandeInscriptionPayload): Response<Unit> {
        return api.envoyerDemandePersonnel(payload)
    }

    suspend fun validerDemande(payload: ValidationDemandePayload): Response<Unit> {
        return api.validerDemandePersonnel(payload)
    }

    suspend fun reconduirePersonnel(ids: List<Long>, idNouvelleAnnee: Long): Response<Unit> {
        return api.reconduirePersonnel(mapOf("idsInscriptionsPrecedentes" to ids, "idNouvelleAnnee" to idNouvelleAnnee))
    }

    suspend fun setBloqueStatut(idUtilisateur: Long, idEtablissement: Long, bloque: Boolean): Response<Unit> {
        return api.setBloqueStatutPersonnel(mapOf("idUtilisateur" to idUtilisateur, "idEtablissement" to idEtablissement, "bloque" to bloque))
    }

    suspend fun getMatieres(): Response<List<MatiereEntity>> {
        return api.getMatieres()
    }

    suspend fun updatePermissions(idIns: Long, added: List<String>, removed: List<String>): Response<Unit> {
        return api.updatePermissions(mapOf(
            "idInscriptionPersonnel" to idIns,
            "permissionsAjoutees" to added,
            "permissionsRetirees" to removed
        ))
    }

    suspend fun getSalles(idAnnee: Long): Response<List<SalleEntity>> {
        return api.getSallesByAnnee(idAnnee)
    }

    suspend fun getEnseignantsBySalle(idSalle: Long): Response<List<AffectationPersonnelSalleResponse>> {
        return api.getEnseignantsBySalle(idSalle)
    }

    suspend fun getAffectationsByMembre(idIns: Long): Response<List<AffectationPersonnelSalleResponse>> {
        return api.getAffectationsByMembre(idIns)
    }

    suspend fun affecterSalle(payload: AffectationPayload): Response<Unit> {
        return api.affecterSallePersonnel(payload)
    }

    suspend fun retirerAffectation(id: Long): Response<Unit> {
        return api.retirerAffectation(id)
    }

    suspend fun banir(id: Long): Response<Unit> {
        return api.banirPersonnel(id)
    }
}
