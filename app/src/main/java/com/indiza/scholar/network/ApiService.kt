package com.indiza.scholar.network

import com.indiza.scholar.model.EnseignementResponse
import com.indiza.scholar.model.LoginResponse
import com.indiza.scholar.model.StudentRegistrationPayload
import com.indiza.scholar.model.StructurePayload
import com.indiza.scholar.model.Utilisateur
import com.indiza.scholar.model.AnneeScolaireEntity
import com.indiza.scholar.model.SalleEntity
import com.indiza.scholar.ui.student.EleveUiModel
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    @POST("/login-user")
    fun login(@Body request: Map<String, String>): retrofit2.Call<LoginResponse>

    @POST("/register")
    fun register(@Body utilisateur: Utilisateur): retrofit2.Call<LoginResponse>

    @GET("/me")
    suspend fun getCurrentUser(): Response<LoginResponse>

    // --- Année Scolaire (Remote-First) ---
    @GET("annee")
    suspend fun getAnnees(): Response<List<AnneeScolaireEntity>>

    @POST("annee")
    suspend fun createAnnee(@Body annee: AnneeScolaireEntity): Response<AnneeScolaireEntity>

    @PUT("annee/{id}")
    suspend fun updateAnnee(@Path("id") id: Long, @Body annee: AnneeScolaireEntity): Response<AnneeScolaireEntity>

    @DELETE("annee/{id}")
    suspend fun deleteAnnee(@Path("id") id: Long): Response<Unit>

    // --- Structure & Salles ---
    @POST("academic-structure")
    suspend fun sauvegarderStructureDistante(@Body payload: StructurePayload): Response<Unit>

    @GET("academic-structure/annee/{idAnneeScolaire}")
    suspend fun getStructureByAnnee(@Path("idAnneeScolaire") idAnneeScolaire: Long): Response<List<EnseignementResponse>>

    @GET("academic-structure/cycles/{idAnneeScolaire}")
    suspend fun getCyclesByAnnee(@Path("idAnneeScolaire") idAnneeScolaire: Long): Response<List<com.indiza.scholar.model.CycleEntity>>

    @POST("academic-structure/classes")
    suspend fun createClasse(@Body classe: com.indiza.scholar.model.ClasseEntity): Response<com.indiza.scholar.model.ClasseEntity>

    @PUT("academic-structure/classes/{id}")
    suspend fun updateClasse(@Path("id") id: Long, @Body classe: com.indiza.scholar.model.ClasseEntity): Response<Unit>

    @GET("salles/annee/{idAnneeScolaire}")
    suspend fun getSallesByAnnee(@Path("idAnneeScolaire") idAnneeScolaire: Long): Response<List<SalleEntity>>

    @GET("salles/classes/stats/{idAnneeScolaire}")
    suspend fun getClassesWithRoomStats(@Path("idAnneeScolaire") idAnneeScolaire: Long): Response<List<com.indiza.scholar.model.ClasseUiModel>>

    @POST("salles")
    suspend fun createSalle(@Body salle: SalleEntity): Response<SalleEntity>

    // --- Students ---
    @POST("students/register-enroll")
    suspend fun registerAndEnrollStudent(@Body payload: StudentRegistrationPayload): Response<Unit>

    @GET("students/room/{idAnneeScolaire}/{idSalle}")
    suspend fun getStudentsByRoom(
        @Path("idAnneeScolaire") idAnneeScolaire: Long,
        @Path("idSalle") idSalle: Long
    ): Response<List<EleveUiModel>>

    @GET("students/search/{idAnneeScolaire}")
    suspend fun searchStudents(
        @Path("idAnneeScolaire") idAnneeScolaire: Long,
        @Query("q") query: String
    ): Response<List<EleveUiModel>>

    @GET("students/all/{idAnneeScolaire}")
    suspend fun getAllStudents(@Path("idAnneeScolaire") idAnneeScolaire: Long): Response<List<EleveUiModel>>

    @PUT("students/{idEleve}")
    suspend fun updateStudent(@Path("idEleve") idEleve: Long, @Body payload: StudentRegistrationPayload): Response<Unit>

    @DELETE("students/enrollment/{idEleve}/{idAnneeScolaire}")
    suspend fun deleteEnrollment(@Path("idEleve") idEleve: Long, @Path("idAnneeScolaire") idAnneeScolaire: Long): Response<Unit>

    @GET("finance/receipt/registration/{idEleve}/{idAnneeScolaire}")
    suspend fun getRegistrationReceiptData(@Path("idEleve") idEleve: Long, @Path("idAnneeScolaire") idAnneeScolaire: Long): Response<com.indiza.scholar.model.ReceiptData>

    @GET("finance/receipt/registration-simple/{idEleve}/{idAnneeScolaire}")
    suspend fun getSimpleRegistrationReceiptData(@Path("idEleve") idEleve: Long, @Path("idAnneeScolaire") idAnneeScolaire: Long): Response<com.indiza.scholar.model.ReceiptData>

    // --- System ---
    @GET("system/stats")
    suspend fun getSystemStats(): Response<SystemStats>

    @GET("system/setup-progress")
    suspend fun getSetupProgress(
        @Query("schoolId") schoolId: Long,
        @Query("yearId") yearId: Long? = null
    ): Response<com.indiza.scholar.model.SetupProgressResponse>

    // --- Établissement ---
    @GET("etablissement/search")
    suspend fun searchSchools(@Query("q") query: String): Response<List<com.indiza.scholar.model.EtablissementEntity>>

    @GET("etablissement/user/{userId}")
    suspend fun getUserSchools(@Path("userId") userId: Long): Response<List<com.indiza.scholar.model.EtablissementEntity>>

    @GET("etablissement/{schoolId}/students/search")
    suspend fun searchStudentsBySchool(
        @Path("schoolId") schoolId: Long,
        @Query("q") query: String
    ): Response<List<com.indiza.scholar.model.EleveEntity>>

    @POST("etablissement")
    suspend fun createSchool(@Body school: com.indiza.scholar.model.EtablissementEntity): Response<com.indiza.scholar.model.EtablissementEntity>

    @PUT("etablissement/{id}")
    suspend fun updateSchool(@Path("id") id: Long, @Body school: com.indiza.scholar.model.EtablissementEntity): Response<Unit>

    @GET("annee/etablissement/{schoolId}")
    suspend fun getYearsBySchool(@Path("schoolId") schoolId: Long): Response<List<AnneeScolaireEntity>>

    // --- Configuration ---
    @GET("config/education-profiles")
    suspend fun getEducationProfiles(): Response<com.indiza.scholar.model.EducationProfilesResponse>

    @GET("pedagogy/matieres")
    suspend fun getMatieres(): Response<List<com.indiza.scholar.model.MatiereEntity>>

    @POST("pedagogy/matieres")
    suspend fun createMatiere(@Body matiere: com.indiza.scholar.model.MatiereEntity): Response<com.indiza.scholar.model.MatiereEntity>

    @PUT("pedagogy/matieres/{id}")
    suspend fun updateMatiere(@Path("id") id: Long, @Body matiere: com.indiza.scholar.model.MatiereEntity): Response<Unit>

    @DELETE("pedagogy/matieres/{id}")
    suspend fun deleteMatiere(@Path("id") id: Long): Response<Unit>

    @GET("pedagogy/matieres/stats/kpi/{idAnneeScolaire}")
    suspend fun getMatiereKPIs(@Path("idAnneeScolaire") idAnneeScolaire: Long): Response<com.indiza.scholar.model.MatiereKPIs>

    @GET("pedagogy/matieres/stats/repartition-classes/{idAnneeScolaire}")
    suspend fun getRepartitionStatsByClass(@Path("idAnneeScolaire") idAnneeScolaire: Long): Response<List<com.indiza.scholar.model.ClassMatiereStat>>

    @GET("pedagogy/matieres/repartition/{idAnneeScolaire}")
    suspend fun getRepartitionByAnnee(
        @Path("idAnneeScolaire") idAnneeScolaire: Long,
        @Query("idClasse") idClasse: Long? = null,
        @Query("idSalle") idSalle: Long? = null
    ): Response<List<com.indiza.scholar.model.RepartitionMatiereEntity>>

    @GET("pedagogy/matieres/groups")
    suspend fun getMatiereGroups(): Response<List<com.indiza.scholar.model.GroupeMatiereEntity>>

    @POST("pedagogy/matieres/groups")
    suspend fun createGroup(@Body group: com.indiza.scholar.model.GroupeMatiereEntity): Response<com.indiza.scholar.model.GroupeMatiereEntity>

    @PUT("pedagogy/matieres/groups/{id}")
    suspend fun updateGroup(@Path("id") id: Long, @Body group: com.indiza.scholar.model.GroupeMatiereEntity): Response<Unit>

    @DELETE("pedagogy/matieres/groups/{id}")
    suspend fun deleteGroup(@Path("id") id: Long): Response<Unit>

    @POST("pedagogy/matieres/groups/clone-templates")
    suspend fun cloneTemplateGroups(@Query("idEtablissement") idEtablissement: Long? = null): Response<Unit>

    // --- Users & Profile ---
    @PUT("users/profile")
    suspend fun updateProfile(@Body body: Map<String, @JvmSuppressWildcards Any?>): Response<Unit>

    @POST("users/change-password")
    suspend fun changePassword(@Body body: Map<String, String>): Response<Unit>

    @GET("pedagogy/specialities")
    suspend fun getSpecialities(): Response<List<com.indiza.scholar.model.Speciality>>

    @POST("users/specialities")
    suspend fun updateSpecialities(@Body specialities: Map<String, List<Long>>): Response<Unit>

    // --- Annonces ---
    @GET("annonces/communaute/{idAnneeScolaire}")
    suspend fun getAnnoncesCommunaute(@Path("idAnneeScolaire") idAnneeScolaire: Long): Response<List<com.indiza.scholar.model.AnnonceEntity>>

    @GET("annonces/publiques")
    suspend fun getAnnoncesPubliques(
        @Query("pays") pays: String? = null,
        @Query("ville") ville: String? = null
    ): Response<List<com.indiza.scholar.model.AnnonceEntity>>

    @POST("annonces")
    suspend fun publierAnnonce(@Body annonce: com.indiza.scholar.model.AnnonceEntity): Response<Unit>

    // --- Périodes & Sous-Périodes ---
    suspend fun cloneClassProgram(@Body payload: com.indiza.scholar.model.CloneProgramPayload): Response<Unit>

    @POST("pedagogy/matieres/repartition/bulk-assign")
    suspend fun bulkAssignSubject(@Body payload: com.indiza.scholar.model.BulkAssignSubjectPayload): Response<Unit>

    @POST("pedagogy/matieres/repartition/transfer-subject")
    suspend fun transferSubject(@Body payload: com.indiza.scholar.model.TransferSubjectPayload): Response<Unit>

    @POST("pedagogy/matieres/repartition/transfer-group")
    suspend fun transferGroup(@Body payload: com.indiza.scholar.model.TransferGroupPayload): Response<Unit>

    // --- Compétences (APC) ---
    @GET("pedagogy/competences")
    suspend fun getGlobalCompetencies(): Response<List<com.indiza.scholar.model.CompetenceEntity>>

    @POST("pedagogy/competences")
    suspend fun createCompetence(@Body competence: com.indiza.scholar.model.CompetenceEntity): Response<com.indiza.scholar.model.CompetenceEntity>

    @GET("pedagogy/matieres/repartition/competences")
    suspend fun getRepartitionCompetences(
        @Query("idRepartitionMatiere") idRepartitionMatiere: Long?,
        @Query("idSousPeriode") idSousPeriode: Long?
    ): Response<List<com.indiza.scholar.model.RepartitionCompetenceEntity>>

    @POST("pedagogy/matieres/repartition/competences")
    suspend fun saveRepartitionCompetence(@Body payload: com.indiza.scholar.model.SaveRepartitionCompetencePayload): Response<com.indiza.scholar.model.RepartitionCompetenceEntity>

    @DELETE("pedagogy/matieres/repartition/competences/{id}")
    suspend fun deleteRepartitionCompetence(@Path("id") id: Long): Response<Unit>

    // --- Périodes & Sous-Périodes ---
    @GET("pedagogy/periodes/annee/{idAnneeScolaire}")
    suspend fun getPeriodesByAnnee(@Path("idAnneeScolaire") idAnneeScolaire: Long): Response<List<com.indiza.scholar.model.PeriodeEntity>>

    @POST("pedagogy/periodes")
    suspend fun createPeriode(@Body periode: com.indiza.scholar.model.PeriodeEntity): Response<com.indiza.scholar.model.PeriodeEntity>

    @PUT("pedagogy/periodes/{id}")
    suspend fun updatePeriode(@Path("id") id: Long, @Body periode: com.indiza.scholar.model.PeriodeEntity): Response<com.indiza.scholar.model.PeriodeEntity>

    @DELETE("pedagogy/periodes/{id}")
    suspend fun deletePeriode(@Path("id") id: Long): Response<Unit>

    @POST("pedagogy/periodes/sous-periodes")
    suspend fun createSousPeriode(@Body sp: com.indiza.scholar.model.SousPeriodeEntity): Response<com.indiza.scholar.model.SousPeriodeEntity>

    @PUT("pedagogy/periodes/sous-periodes/{id}")
    suspend fun updateSousPeriode(@Path("id") id: Long, @Body sp: com.indiza.scholar.model.SousPeriodeEntity): Response<com.indiza.scholar.model.SousPeriodeEntity>

    @DELETE("pedagogy/periodes/sous-periodes/{id}")
    suspend fun deleteSousPeriode(@Path("id") id: Long): Response<Unit>

    @POST("pedagogy/periodes/clone")
    suspend fun clonePeriodes(@Body payload: Map<String, Long>): Response<Unit>

    @GET("pedagogy/periodes/repartition/{idAnneeScolaire}")
    suspend fun getSequenceRepartition(
        @Path("idAnneeScolaire") idAnneeScolaire: Long,
        @Query("idClasse") idClasse: Long? = null
    ): Response<List<com.indiza.scholar.model.RepartitionSousPeriodeEntity>>

    @POST("pedagogy/periodes/repartition/bulk-assign")
    suspend fun bulkAssignSequences(@Body payload: com.indiza.scholar.model.SequenceRepartitionPayload): Response<Unit>

    // --- Personnel ---
    @POST("personnel/demande")
    suspend fun envoyerDemandePersonnel(@Body payload: com.indiza.scholar.model.DemandeInscriptionPayload): Response<Unit>

    @GET("personnel/demandes/etablissement/{idEtablissement}")
    suspend fun getDemandesEnAttente(@Path("idEtablissement") idEtablissement: Long): Response<List<com.indiza.scholar.model.DemandeInscriptionPersonnel>>

    @POST("personnel/valider-demande")
    suspend fun validerDemandePersonnel(@Body payload: com.indiza.scholar.model.ValidationDemandePayload): Response<Unit>

    @POST("personnel/update-permissions")
    suspend fun updatePermissions(@Body body: Map<String, @JvmSuppressWildcards Any>): Response<Unit>

    @POST("personnel/reconduire")
    suspend fun reconduirePersonnel(@Body body: Map<String, @JvmSuppressWildcards Any>): Response<Unit>

    @POST("personnel/bloquer")
    suspend fun setBloqueStatutPersonnel(@Body body: Map<String, Any>): Response<Unit>

    @POST("personnel/affecter")
    suspend fun affecterSallePersonnel(@Body payload: com.indiza.scholar.model.AffectationPayload): Response<Unit>

    @DELETE("personnel/affecter/{id}")
    suspend fun retirerAffectation(@Path("id") id: Long): Response<Unit>

    @POST("personnel/banir/{id}")
    suspend fun banirPersonnel(@Path("id") id: Long): Response<Unit>

    @GET("personnel/affectations/salle/{idSalle}")
    suspend fun getEnseignantsBySalle(@Path("idSalle") idSalle: Long): Response<List<com.indiza.scholar.model.AffectationPersonnelSalleResponse>>

    @GET("personnel/affectations/membre/{idInscriptionPersonnel}")
    suspend fun getAffectationsByMembre(@Path("idInscriptionPersonnel") idIns: Long): Response<List<com.indiza.scholar.model.AffectationPersonnelSalleResponse>>

    @GET("personnel/actif/{idEtablissement}/{idAnneeScolaire}")
    suspend fun getPersonnelActif(
        @Path("idEtablissement") idEtablissement: Long,
        @Path("idAnneeScolaire") idAnneeScolaire: Long
    ): Response<List<com.indiza.scholar.model.InscriptionPersonnelEntity>>

    @GET("personnel/user-associations/{userId}")
    suspend fun getUserAssociations(@Path("userId") userId: Long): Response<List<com.indiza.scholar.model.UserAssociation>>

    @GET("personnel/my-demands/{userId}")
    suspend fun getMyDemands(@Path("userId") userId: Long): Response<List<com.indiza.scholar.model.DemandeInscriptionPersonnel>>

    // --- Finance ---
    @GET("finance/exigibles/library")
    suspend fun getFraisExigiblesLibrary(): Response<List<com.indiza.scholar.model.FraisExigibleEntity>>

    @POST("finance/exigibles/library")
    suspend fun createFraisExigible(@Body frais: com.indiza.scholar.model.FraisExigibleEntity): Response<com.indiza.scholar.model.FraisExigibleEntity>

    @PUT("finance/exigibles/library/{id}")
    suspend fun updateFraisExigible(@Path("id") id: Long, @Body frais: com.indiza.scholar.model.FraisExigibleEntity): Response<Unit>

    @DELETE("finance/exigibles/library/{id}")
    suspend fun deleteFraisExigible(@Path("id") id: Long): Response<Unit>

    // --- Frais Périscolaires ---
    @GET("finance/periscolaires/library")
    suspend fun getFraisPeriscolairesLibrary(): Response<List<com.indiza.scholar.model.FraisPeriscolaireEntity>>

    @POST("finance/periscolaires/library")
    suspend fun createFraisPeriscolaire(@Body frais: com.indiza.scholar.model.FraisPeriscolaireEntity): Response<com.indiza.scholar.model.FraisPeriscolaireEntity>

    @PUT("finance/periscolaires/library/{id}")
    suspend fun updateFraisPeriscolaire(@Path("id") id: Long, @Body frais: com.indiza.scholar.model.FraisPeriscolaireEntity): Response<Unit>

    @DELETE("finance/periscolaires/library/{id}")
    suspend fun deleteFraisPeriscolaire(@Path("id") id: Long): Response<Unit>

    @GET("finance/tarifs/classe/{idClasse}/{idAnneeScolaire}")
    suspend fun getTarifsByClasse(
        @Path("idClasse") idClasse: Long,
        @Path("idAnneeScolaire") idAnneeScolaire: Long
    ): Response<List<com.indiza.scholar.model.TarifFraisEntity>>

    @POST("finance/tarifs/save")
    suspend fun saveTarifs(@Body payload: com.indiza.scholar.model.SaveTarifsPayload): Response<Unit>

    @GET("finance/classes/missing-frais/{idFrais}/{idAnneeScolaire}")
    suspend fun getClassesMissingFrais(
        @Path("idFrais") idFrais: Long,
        @Path("idAnneeScolaire") idAnneeScolaire: Long
    ): Response<List<com.indiza.scholar.model.ClassMissingFrais>>

    @POST("finance/tarifs/bulk-apply")
    suspend fun bulkApplyTarif(@Body payload: com.indiza.scholar.model.BulkApplyPayload): Response<Unit>

    @GET("finance/stats/recouvrement/{idClasse}/{idAnneeScolaire}")
    suspend fun getRecouvrementStats(
        @Path("idClasse") idClasse: Long,
        @Path("idAnneeScolaire") idAnneeScolaire: Long
    ): Response<com.indiza.scholar.model.RecouvrementStatsResponse>

    @POST("finance/paiements/exigibles")
    suspend fun payerFraisExigibles(@Body payload: com.indiza.scholar.model.PaiementPayload): Response<Map<String, Any>>

    @POST("finance/paiements/periscolaires")
    suspend fun payerFraisPeriscolaires(@Body payload: com.indiza.scholar.model.PaiementPayload): Response<Map<String, Any>>

    @GET("finance/paiements/details/{idEleve}/{idAnneeScolaire}")
    suspend fun getStudentPaymentDetails(
        @Path("idEleve") idEleve: Long,
        @Path("idAnneeScolaire") idAnneeScolaire: Long
    ): Response<com.indiza.scholar.model.StudentPaymentDetails>

    @GET("finance/paiements/periscolaires/details/{idEleve}/{idAnneeScolaire}")
    suspend fun getStudentPeriscolaireDetails(
        @Path("idEleve") idEleve: Long,
        @Path("idAnneeScolaire") idAnneeScolaire: Long
    ): Response<com.indiza.scholar.model.StudentPaymentDetails>

    @GET("finance/paiements/transactions/{idEleve}/{idAnneeScolaire}")
    suspend fun getStudentTransactions(
        @Path("idEleve") idEleve: Long,
        @Path("idAnneeScolaire") idAnneeScolaire: Long
    ): Response<List<com.indiza.scholar.model.PaiementFraisGlobalEntity>>

    @POST("finance/paiements/annuler/{idPaiementFraisGlobal}")
    suspend fun annulerPaiement(@Path("idPaiementFraisGlobal") id: Long): Response<Unit>

    // --- Reports & Analytics ---
    @GET("finance/reports/bilan/journalier/{idAnneeScolaire}")
    suspend fun getBilanJournalier(
        @Path("idAnneeScolaire") idAnneeScolaire: Long,
        @Query("date") date: String? = null
    ): Response<com.indiza.scholar.model.BilanResponse>

    @GET("finance/reports/bilan/mensuel/{idAnneeScolaire}")
    suspend fun getBilanMensuel(
        @Path("idAnneeScolaire") idAnneeScolaire: Long,
        @Query("month") month: Int? = null,
        @Query("year") year: Int? = null
    ): Response<com.indiza.scholar.model.BilanResponse>

    @GET("finance/reports/bilan/annuel/{idAnneeScolaire}")
    suspend fun getBilanAnnuel(@Path("idAnneeScolaire") idAnneeScolaire: Long): Response<com.indiza.scholar.model.BilanResponse>

    @GET("finance/reports/comparaison/performance/{idAnneeScolaire}")
    suspend fun getPerformanceComparison(
        @Path("idAnneeScolaire") idAnneeScolaire: Long,
        @Query("idCycle") idCycle: Long? = null,
        @Query("idEnseignement") idEnseignement: Long? = null
    ): Response<List<com.indiza.scholar.model.PerformanceRpItem>>

    @GET("finance/reports/listes/insolvables/{idAnneeScolaire}/{idTranche}")
    suspend fun getInsolvablesList(
        @Path("idAnneeScolaire") idAnneeScolaire: Long,
        @Path("idTranche") idTranche: Long,
        @Query("idSalle") idSalle: Long? = null,
        @Query("severity") severity: String? = null
    ): Response<List<com.indiza.scholar.model.InsolvableItem>>

    // --- Notes & Absences ---
    @GET("pedagogy/notes/matiere")
    suspend fun getNotesByMatiere(
        @Query("idSalle") idSalle: Long,
        @Query("idRepartitionMatiere") idRepartitionMatiere: Long,
        @Query("idSequence") idSequence: Long,
        @Query("idAnneeScolaire") idAnneeScolaire: Long
    ): Response<List<com.indiza.scholar.model.NoteUiModel>>

    @POST("pedagogy/notes/save")
    suspend fun saveNotes(@Body payload: com.indiza.scholar.model.SaveNotesPayload): Response<Unit>

    @POST("pedagogy/notes/bulk-action")
    suspend fun bulkActionNotes(@Body payload: com.indiza.scholar.model.BulkActionNotesPayload): Response<Unit>

    @GET("pedagogy/notes/student")
    suspend fun getNotesByStudent(
        @Query("idInscription") idInscription: Long,
        @Query("idSequence") idSequence: Long,
        @Query("idAnneeScolaire") idAnneeScolaire: Long,
        @Query("idClasse") idClasse: Long
    ): Response<List<com.indiza.scholar.model.StudentNoteUiModel>>

    @POST("pedagogy/notes/student/save")
    suspend fun saveNotesByStudent(@Body payload: com.indiza.scholar.model.SaveStudentNotesPayload): Response<Unit>

    @GET("pedagogy/notes/absences")
    suspend fun getAbsences(
        @Query("idSalle") idSalle: Long,
        @Query("idSequence") idSequence: Long,
        @Query("idAnneeScolaire") idAnneeScolaire: Long,
        @Query("idRepartitionCompetence") idRepartitionCompetence: Long? = null
    ): Response<List<com.indiza.scholar.model.AbsenceUiModel>>

    @GET("pedagogy/notes/progress/salle")
    suspend fun getSalleProgress(
        @Query("idSalle") idSalle: Long,
        @Query("idSequence") idSequence: Long,
        @Query("idAnneeScolaire") idAnneeScolaire: Long
    ): Response<com.indiza.scholar.model.ProgressUiModel>

    @GET("pedagogy/notes/progress/student")
    suspend fun getStudentProgress(
        @Query("idInscription") idInscription: Long,
        @Query("idSequence") idSequence: Long,
        @Query("idAnneeScolaire") idAnneeScolaire: Long
    ): Response<com.indiza.scholar.model.ProgressUiModel>

    @GET("pedagogy/notes/progress/matiere")
    suspend fun getMatiereProgress(
        @Query("idSalle") idSalle: Long,
        @Query("idRepartitionMatiere") idRepartitionMatiere: Long,
        @Query("idSequence") idSequence: Long,
        @Query("idAnneeScolaire") idAnneeScolaire: Long
    ): Response<com.indiza.scholar.model.ProgressUiModel>

    suspend fun getAbsencesBySalle(
        @Query("idSalle") idSalle: Long,
        @Query("idSequence") idSequence: Long,
        @Query("idAnneeScolaire") idAnneeScolaire: Long
    ): Response<List<com.indiza.scholar.model.AbsenceUiModel>>

    @POST("pedagogy/notes/absences/save")
    suspend fun saveAbsences(@Body payload: com.indiza.scholar.model.SaveAbsencesPayload): Response<Unit>

    @GET("pedagogy/notes/pv")
    suspend fun getPVData(
        @Query("type") type: String,
        @Query("idAnneeScolaire") idAnneeScolaire: Long,
        @Query("idSalle") idSalle: Long? = null,
        @Query("idSequence") idSequence: Long? = null,
        @Query("idPeriode") idPeriode: Long? = null
    ): Response<com.indiza.scholar.model.PVResponse>

    @GET("pedagogy/notes/justifications")
    suspend fun getJustifications(): Response<List<com.indiza.scholar.model.JustificationEntity>>

    @POST("pedagogy/notes/justifications")
    suspend fun createJustification(@Body justification: com.indiza.scholar.model.JustificationEntity): Response<com.indiza.scholar.model.JustificationEntity>

    @PUT("pedagogy/notes/justifications/{id}")
    suspend fun updateJustification(@Path("id") id: Long, @Body justification: com.indiza.scholar.model.JustificationEntity): Response<Unit>

    @DELETE("pedagogy/notes/justifications/{id}")
    suspend fun deleteJustification(@Path("id") id: Long): Response<Unit>
}

data class SystemStats(
    val online: Boolean,
    val value: Int,
    val label: String,
    val extra: Map<String, Any>? = null
)

