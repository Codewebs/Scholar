package com.indiza.scholar.model

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector

enum class AcademicPermission(
    val labelFr: String,
    val labelEn: String,
    val descriptionFr: String,
    val descriptionEn: String
) {
    // --- Menus from menuSeeder.js ---
    DASHBOARD_ETABLISSEMENT("Tableau de Bord", "Dashboard", "Vue d'ensemble des activités de l'établissement", "Overview of school activities"),
    ACTIVITY_LOGS("Logs d'activité", "Activity Logs", "Consulter l'historique des actions utilisateurs", "View user action history"),
    SESSIONS_CONNECTIONS("Sessions & Connexions", "Sessions & Connections", "Gérer les sessions actives et l'historique de connexion", "Manage active sessions and login history"),
    MANAGE_LEVELS("Gérer les Niveaux", "Manage Levels", "Configurer les niveaux d'études", "Configure study levels"),
    MANAGE_STREAMS("Gérer les Filières", "Manage Streams", "Configurer les filières et séries", "Configure streams and series"),
    IMPORT_STUDENTS("Importer des Élèves", "Import Students", "Importation massive d'élèves via Excel/CSV", "Bulk student import via Excel/CSV"),
    STUDENT_DOSSIER("Dossier Élève", "Student Dossier", "Accès complet au dossier pédagogique d'un élève", "Full access to a student's pedagogical file"),
    HARMONIZE_GRADES("Harmoniser les Notes", "Harmonize Grades", "Action de péréquation et harmonisation des notes", "Grade equalization and harmonization"),
    VALIDATE_GRADES("Valider les Notes", "Validate Grades", "Validation finale des notes avant impression", "Final grade validation before printing"),
    ACADEMIC_STATS("Stats Académiques", "Academic Stats", "Consulter les statistiques de réussite et d'échec", "View success and failure statistics"),
    GRADES_COMPLETION_RATE("Taux de remplissage des notes", "Grades Filling Rate", "Suivre l'avancement de la saisie des notes", "Track progress of grade entry"),
    GLOBAL_ATTENDANCE("Présence Globale", "Global Attendance", "Consulter l'assiduité générale des élèves", "View overall student attendance"),
    ATTENDANCE_CERTIFICATE("Certificat de Scolarité", "School Certificate", "Générer et imprimer les certificats de scolarité", "Generate and print school certificates"),
    EXPORT_PDF_CLASS("Exporter PDF Classe", "Export PDF Class", "Générer les listes de classe en PDF", "Generate class lists in PDF"),
    MANAGE_SEQUENCES("Gérer les Séquences", "Manage Sequences", "Configurer les séquences d'évaluation", "Configure evaluation sequences"),
    MANAGE_TERMS("Gérer les Trimestres", "Manage Terms", "Gérer les périodes trimestrielles", "Manage quarterly periods"),
    MANAGE_PERIODS("Gérer les Périodes", "Manage Periods", "Configuration générale des périodes scolaires", "General configuration of school periods"),
    MANAGE_SUB_PERIODS("Gérer les Sous-Périodes", "Manage Sub-Periods", "Découpage fin des périodes (Séquences, etc.)", "Fine breakdown of periods"),
    MANAGE_USERS("Gérer les Utilisateurs", "Manage Users", "Créer et gérer les comptes utilisateurs", "Create and manage user accounts"),
    BACKUP_DB("Sauvegarder BD", "Backup DB", "Effectuer une sauvegarde de la données", "Perform a database backup"),
    RESTORE_DB("Restaurer BD", "Restore DB", "Restaurer les données depuis une sauvegarde", "Restore data from a backup"),
    LOAD_MENUS("Charger les Menus", "Load Menus", "Recharger la configuration des menus système", "Reload system menu configuration"),
    EDIT_OWN_ACCOUNT("Modifier son Compte", "Edit Own Account", "Modifier ses propres informations de profil", "Edit own profile information"),
    MANAGE_CYCLES("Gérer les Cycles", "Manage Cycles", "Configurer les cycles (Primaire, Secondaire, etc.)", "Configure cycles (Primary, Secondary, etc.)"),
    MANAGE_CLASSES("Gérer les Classes", "Manage Classes", "Création et modification des classes", "Create and modify classes"),
    MANAGE_ROOMS("Gérer les Salles", "Manage Rooms", "Gérer les salles de classe physiques", "Manage physical classrooms"),
    MANAGE_PAYMENT_MODES("Modes de Paiement", "Payment Modes", "Configurer les modes de règlement acceptés", "Configure accepted payment modes"),
    MANAGE_BANKS("Gérer les Banques", "Manage Banks", "Liste des banques partenaires", "List of partner banks"),
    MANAGE_NEIGHBORHOODS("Gérer les Quartiers", "Manage Neighborhoods", "Configuration géographique", "Geographical configuration"),
    MANAGE_MONTHS("Gérer les Mois", "Manage Months", "Configuration des mois scolaires", "School months configuration"),
    TRANSPORT_RATES("Tarifs Transport", "Transport Rates", "Gérer les zones et tarifs de transport", "Manage transport zones and rates"),
    MANAGE_FUNCTIONS("Gérer les Fonctions", "Manage Functions", "Définir les fonctions du personnel", "Define staff functions"),
    MANAGE_GRADES("Gérer les Notes", "Manage Grades", "Saisie et modification des notes", "Grade entry and modification"),
    MANAGE_STAFF("Gérer le Personnel", "Manage Staff", "Inscrire et gérer les membres du personnel", "Enroll and manage staff members"),
    PAY_OTHER_FEES("Payer Autres Frais", "Pay Other Fees", "Encaisser les frais divers", "Collect miscellaneous fees"),
    PAY_TRANSPORT("Payer Transport", "Pay Transport", "Encaisser les frais de transport", "Collect transport fees"),
    MANAGE_JUSTIFICATIONS("Gérer les Justifications", "Manage Justifications", "Gérer les motifs d'absence", "Manage absence reasons"),
    GRADES_REPORT_SHEET("Fiche de Notes", "Grades Report Sheet", "Consulter et imprimer les fiches de notes", "View and print grade sheets"),
    PRINT_ANNUAL_REPORT_CARDS("Imprimer Bulletins Annuels", "Print Annual Report Cards", "Générer les bulletins de fin d'année", "Generate end-of-year report cards"),
    PRINT_STUDENT_CARDS("Imprimer Cartes Scolaires", "Print Student Cards", "Générer les cartes d'identité scolaire", "Generate school ID cards"),
    FINANCIAL_BALANCE_SHEET("Bilan Financier", "Financial Balance Sheet", "Vue globale des entrées et sorties", "Global view of income and expenses"),
    ROOM_EFFECTIVE("Effectif par Salle", "Room Effective", "Consulter le nombre d'élèves par salle", "View student count per room"),
    TUITION_BALANCE_SHEET("Bilan Scolarité", "Tuition Balance Sheet", "État des paiements de scolarité", "Tuition payment status"),
    OTHER_FEES_BALANCE_SHEET("Bilan Autres Frais", "Other Fees Balance Sheet", "Suivi des frais annexes", "Tracking of secondary fees"),
    TRANSPORT_BALANCE_SHEET("Bilan Transport", "Transport Balance Sheet", "Suivi des revenus de transport", "Tracking of transport revenue"),
    EXIT_SLIP("Billet de Sortie", "Exit Slip", "Gérer les autorisations de sortie", "Manage exit authorizations"),
    STAFF_PLACEMENT("Placement Personnel", "Staff Placement", "Affecter le personnel aux classes/salles", "Assign staff to classes/rooms"),
    CALCULATOR("Calculatrice", "Calculator", "Accès à l'outil de calcul", "Access to the calculation tool"),
    ABOUT("À propos", "About", "Informations sur l'application", "Information about the application"),
    SUMMARY("Résumé", "Summary", "Résumé des activités quotidiennes", "Summary of daily activities"),
    WEB_VERSION("Version Web", "Web Version", "Lien vers la plateforme web", "Link to the web platform"),
    CHOOSE_BUTTON("Bouton Choisir", "Choose Button", "Permissions liées aux sélecteurs", "Selector permissions"),
    NEW_OLD_EFFECTIVE("Effectif Nouveaux/Anciens", "New/Old Effective", "Comparer les nouveaux et anciens élèves", "Compare new and old students"),
    GLOBAL_TUITION_STATUS("Statut Scolarité Global", "Global Tuition Status", "Taux de recouvrement global", "Global recovery rate"),
    MANAGE_SANCTIONS("Gérer les Sanctions", "Manage Sanctions", "Saisie des sanctions disciplinaires", "Disciplinarity sanctions entry"),
    PERMISSION_REASONS("Motifs de Permission", "Permission Reasons", "Gérer les types de permissions d'absence", "Manage absence permission types"),
    CYCLE_EFFECTIVE_HISTOGRAM("Histogramme Effectif/Cycle", "Cycle Effective Histogram", "Graphique de répartition par cycle", "Distribution graph by cycle"),
    GENERAL_CONFIG("Configuration Générale", "General Config", "Paramètres globaux du système", "Global system settings"),
    MANAGE_TUTORSHIP("Gérer le Tutorat", "Manage Tutorship", "Gérer les relations tuteurs/élèves", "Manage tutor/student relationships"),

    // --- Legacy / Specific Actions ---
    REGISTER_STUDENT("Inscrire Élève", "Register Student", "Ajouter un nouvel élève au système", "Add a new student to the system"),
    ENROLL_STUDENT("Recruter Élève", "Enroll Student", "Inscrire un élève pour une année scolaire", "Enroll a student for a school year"),
    EDIT_STUDENT_INFO("Modifier Info Élève", "Edit Student Info", "Mettre à jour les données personnelles de l'élève", "Update student personal data"),
    UNENROLL_STUDENT("Désinscrire Élève", "Unenroll Student", "Retirer un élève de l'année scolaire", "Remove a student from the school year"),
    PRINT_STUDENT_INFO("Imprimer Info Élève", "Print Student Info", "Imprimer la fiche individuelle", "Print individual sheet"),

    COLLECT_REGISTRATION_FEE("Percevoir Frais Inscription", "Collect Registration Fee", "Encaisser les frais lors de l'inscription", "Collect fees during registration"),
    COLLECT_TUITION_FEE("Percevoir Scolarité", "Collect Tuition Fee", "Encaisser les tranches de scolarité", "Collect tuition installments"),
    COLLECT_OTHER_FEES("Percevoir Autres Frais", "Collect Other Fees", "Encaisser les frais periscolaires et autres", "Collect extracurricular and other fees"),
    CANCEL_PAYMENT("Annuler Paiement", "Cancel Payment", "Supprimer ou annuler une transaction financière", "Delete or cancel a financial transaction"),
    VIEW_FINANCIAL_REPORTS("Voir Rapports Financiers", "View Financial Reports", "Accéder aux états financiers détaillés", "Access detailed financial statements"),

    VIEW_STUDENT_LIST("Voir Liste Élèves", "View Student List", "Consulter la liste des élèves", "View the student list"),
    VIEW_PAYMENT_STATUS("Voir Statut Paiement", "View Payment Status", "Vérifier le solde d'un élève", "Check a student's balance"),
    VIEW_MY_PAYMENT_STATUS("Voir My Statut Paiement", "View My Payment Status", "Vérifier le solde de mes payements élève", "Check my student's balance"),
    MANAGE_ACADEMIC_CONFIG("Gérer Config Académique", "Manage Academic Config", "Paramètres avancés de la pédagogie", "Advanced pedagogical settings"),
    EDIT_STUDENT_NOTE("Modifier Note Élève", "Edit Student Note", "Modifier une note déjà saisie", "Edit a previously entered grade"),
    PRINT_STUDENT_CARD("Imprimer Carte Élève", "Print Student Card", "Impression individuelle de carte", "Individual card printing"),

    REGISTER_TEACHER("Inscrire Enseignant", "Register Teacher", "Ajouter un enseignant", "Add a teacher"),
    ENROLL_TEACHER("Recruter Enseignant", "Enroll Teacher", "Affecter un enseignant à l'année", "Assign a teacher to the year"),
    EDIT_TEACHER_INFO("Modifier Info Enseignant", "Edit Teacher Info", "Mettre à jour les données de l'enseignant", "Update teacher data"),
    UNENROLL_TEACHER("Retirer Enseignant", "Unenroll Teacher", "Retirer un enseignant de l'année", "Remove a teacher from the year"),
    PRINT_TEACHER_INFO("Imprimer Info Enseignant", "Print Teacher Info", "Imprimer la fiche enseignant", "Print teacher sheet"),

    REGISTER_USER("Inscrire Utilisateur", "Register User", "Créer un compte accès", "Create an access account"),
    ENROLL_USER("Recruter Utilisateur", "Enroll User", "Activer un utilisateur", "Activate a user"),
    EDIT_USER_INFO("Modifier Info Utilisateur", "Edit User Info", "Modifier les accès utilisateur", "Edit user access"),
    UNENROLL_USER("Retirer Utilisateur", "Unenroll User", "Désactiver un compte", "Deactivate an account"),
    PRINT_USER_INFO("Imprimer Info Utilisateur", "Print User Info", "Imprimer les accès", "Print access details"),

    SEND_MESSAGE("Envoyer Message", "Send Message", "Envoyer des SMS ou notifications", "Send SMS or notifications"),
    VIEW_MESSAGES("Voir Messages", "View Messages", "Consulter l'historique des messages", "View message history"),
    EDIT_MESSAGE("Modifier Message", "Edit Message", "Modifier un message programmé", "Edit a scheduled message"),
    DELETE_MESSAGE("Supprimer Message", "Delete Message", "Supprimer un message de l'historique", "Delete a message from history"),

    REGISTER_CONFIG("Enregistrer Config", "Register Config", "Créer une nouvelle configuration", "Create a new configuration"),
    EDIT_CONFIG("Modifier Config", "Edit Config", "Modifier une configuration", "Edit a configuration"),
    PRINT_CONFIG("Imprimer Config", "Print Config", "Imprimer les paramètres", "Print settings"),

    REGISTER_SCHOOL("Inscrire École", "Register School", "Ajouter un établissement", "Add an establishment"),
    ENROLL_SCHOOL("Recruter École", "Enroll School", "Activer l'établissement", "Activate the establishment"),
    EDIT_SCHOOL_INFO("Modifier Info École", "Edit School Info", "Mettre à jour les infos école", "Update school info"),
    UNENROLL_SCHOOL("Retirer École", "Unenroll School", "Désactiver l'établissement", "Deactivate the establishment"),
    PRINT_SCHOOL_INFO("Imprimer Info École", "Print School Info", "Imprimer les infos école", "Print school info"),

    REGISTER_SCHOOL_YEAR("Inscrire Année", "Register School Year", "Créer une nouvelle année scolaire", "Create a new school year"),
    ENROLL_SCHOOL_YEAR("Activer Année", "Enroll School Year", "Lancer l'année scolaire", "Start the school year"),
    EDIT_SCHOOL_YEAR_INFO("Modifier Info Année", "Edit School Year Info", "Modifier les dates de l'année", "Edit year dates"),
    UNENROLL_SCHOOL_YEAR("Retirer Année", "Unenroll School Year", "Clôturer l'année", "Close the year"),
    PRINT_SCHOOL_YEAR_INFO("Imprimer Info Année", "Print School Year Info", "Imprimer le calendrier", "Print the calendar"),
    COLLECT_SCHOOL_YEAR_INFO("Rapport Annuel", "School Year Report", "Générer le rapport de l'année", "Generate the year report"),
    VIEW_SCHOOL_YEAR_INFO("Voir année scolaire", "View School Year", "Permet de voir l'année scolaire de l'ecole actuel", "View the school year"),
    COLLECT_ALL_SCHOOL_YEARS_INFO("Archives", "All School Years Info", "Accéder aux archives des années", "Access year archives");

    fun label(lang: String): String = if (lang == "en") labelEn else labelFr
    fun description(lang: String): String = if (lang == "en") descriptionEn else descriptionFr
}

/**
 * Structure d'encapsulation : Menu -> Module -> Fonctionnalité (Permission)
 */
sealed class AppModule(val title: String, val permissions: List<AcademicPermission>) {
    // ECOLE
    object SchoolProfile : AppModule("Profil École", listOf(AcademicPermission.PRINT_SCHOOL_INFO, AcademicPermission.EDIT_SCHOOL_INFO))
    object SchoolYear : AppModule("Années Scolaires", listOf(AcademicPermission.VIEW_SCHOOL_YEAR_INFO, AcademicPermission.REGISTER_SCHOOL_YEAR))

    // ELEVES
    object StudentList : AppModule("Liste des Élèves", listOf(AcademicPermission.VIEW_STUDENT_LIST))
    object StudentRegistration : AppModule("Inscription/Recrutement", listOf(AcademicPermission.REGISTER_STUDENT, AcademicPermission.ENROLL_STUDENT))
    object StudentDossier : AppModule("Dossier Pédagogique", listOf(AcademicPermission.STUDENT_DOSSIER))
    
    // PAIEMENTS
    object PaymentsEntry : AppModule("Saisie Paiements", listOf(AcademicPermission.COLLECT_TUITION_FEE, AcademicPermission.COLLECT_REGISTRATION_FEE, AcademicPermission.COLLECT_OTHER_FEES))
    object FinancialReports : AppModule("Bilans Financiers", listOf(AcademicPermission.VIEW_FINANCIAL_REPORTS, AcademicPermission.FINANCIAL_BALANCE_SHEET))

    // PERSONNEL
    object StaffManagement : AppModule("Gestion RH", listOf(AcademicPermission.MANAGE_STAFF, AcademicPermission.MANAGE_FUNCTIONS))
    object StaffPlacement : AppModule("Affectations", listOf(AcademicPermission.STAFF_PLACEMENT))

    // EQUIPE
    object TeacherManagement : AppModule("Enseignants", listOf(AcademicPermission.REGISTER_TEACHER, AcademicPermission.ENROLL_TEACHER))

    // MATIERES
    object SubjectsConfig : AppModule("Configuration Matières", listOf(AcademicPermission.MANAGE_STREAMS, AcademicPermission.MANAGE_LEVELS, AcademicPermission.MANAGE_CYCLES))

    // NOTES
    object GradesEntry : AppModule("Saisie des Notes", listOf(AcademicPermission.MANAGE_GRADES, AcademicPermission.EDIT_STUDENT_NOTE))
    object GradesValidation : AppModule("Validation", listOf(AcademicPermission.VALIDATE_GRADES, AcademicPermission.HARMONIZE_GRADES))

    // BULLETINS
    object ReportCards : AppModule("Bulletins", listOf(AcademicPermission.PRINT_ANNUAL_REPORT_CARDS, AcademicPermission.GRADES_REPORT_SHEET))

    // CLASSES
    object ClassesConfig : AppModule("Salles & Classes", listOf(AcademicPermission.MANAGE_CLASSES, AcademicPermission.MANAGE_ROOMS))

    // PARAMETRES
    object SystemUsers : AppModule("Utilisateurs", listOf(AcademicPermission.MANAGE_USERS, AcademicPermission.ACTIVITY_LOGS))
    object SystemMaintenance : AppModule("Maintenance", listOf(AcademicPermission.BACKUP_DB, AcademicPermission.RESTORE_DB, AcademicPermission.GENERAL_CONFIG))

    // STATS
    object GlobalStats : AppModule("Statistiques", listOf(AcademicPermission.ACADEMIC_STATS, AcademicPermission.GLOBAL_TUITION_STATUS, AcademicPermission.SUMMARY))
}

enum class AppMenu(val title: String, val emoji: String, val description: String, val modules: List<AppModule>) {
    ECOLE("Ecole", "🏫", "Gestion de l'établissement", listOf(AppModule.SchoolProfile, AppModule.SchoolYear)),
    ELEVES("Élèves", "👤", "Gestion des effectifs et dossiers", listOf(AppModule.StudentList, AppModule.StudentRegistration, AppModule.StudentDossier)),
    PAIEMENTS("Paiements", "💰", "Suivi financier et scolarités", listOf(AppModule.PaymentsEntry, AppModule.FinancialReports)),
    PERSONNEL("Personnel", "👔", "Gestion RH et affectations", listOf(AppModule.StaffManagement, AppModule.StaffPlacement)),
    EQUIPE("Équipe", "🎓", "Équipe pédagogique", listOf(AppModule.TeacherManagement)),
    MATIERES("Matières", "📚", "Programmes et matières", listOf(AppModule.SubjectsConfig)),
    NOTES("Note/Examen", "📝", "Saisie et suivi des évaluations", listOf(AppModule.GradesEntry, AppModule.GradesValidation)),
    BULLETINS("Bulletins", "📊", "Génération des résultats", listOf(AppModule.ReportCards)),
    CLASSES("Classes", "🏫", "Salles et répartitions", listOf(AppModule.ClassesConfig)),
    PARAMETRES("Paramètres", "⚙️", "Configuration du système", listOf(AppModule.SystemUsers, AppModule.SystemMaintenance)),
    STATS("Stats", "📈", "Statistiques globales", listOf(AppModule.GlobalStats));
}

data class PermissionGroup(
    val nameFr: String,
    val nameEn: String,
    val subGroups: List<PermissionGroup> = emptyList(),
    val permissions: List<AcademicPermission> = emptyList()
) {
    fun name(lang: String): String = if (lang == "en") nameEn else nameFr
}

object PermissionGroups {
    val groups = listOf(
        PermissionGroup(
            "Dashboard & Statistiques", "Dashboard & Stats",
            permissions = listOf(
                AcademicPermission.DASHBOARD_ETABLISSEMENT,
                AcademicPermission.ACADEMIC_STATS,
                AcademicPermission.SUMMARY,
                AcademicPermission.NEW_OLD_EFFECTIVE,
                AcademicPermission.CYCLE_EFFECTIVE_HISTOGRAM,
                AcademicPermission.ROOM_EFFECTIVE,
                AcademicPermission.GLOBAL_TUITION_STATUS
            )
        ),
        PermissionGroup(
            "Gestion Académique", "Academic Management",
            subGroups = listOf(
                PermissionGroup(
                    "Structures", "Structures",
                    permissions = listOf(
                        AcademicPermission.MANAGE_CYCLES,
                        AcademicPermission.MANAGE_LEVELS,
                        AcademicPermission.MANAGE_STREAMS,
                        AcademicPermission.MANAGE_CLASSES,
                        AcademicPermission.MANAGE_ROOMS,
                        AcademicPermission.MANAGE_NEIGHBORHOODS,
                        AcademicPermission.MANAGE_ACADEMIC_CONFIG
                    )
                ),
                PermissionGroup(
                    "Périodes & Calendrier", "Periods & Calendar",
                    permissions = listOf(
                        AcademicPermission.MANAGE_PERIODS,
                        AcademicPermission.MANAGE_SUB_PERIODS,
                        AcademicPermission.MANAGE_TERMS,
                        AcademicPermission.MANAGE_SEQUENCES,
                        AcademicPermission.MANAGE_MONTHS
                    )
                ),
                PermissionGroup(
                    "Configuration Année", "Year Config",
                    permissions = listOf(
                        AcademicPermission.REGISTER_SCHOOL_YEAR,
                        AcademicPermission.ENROLL_SCHOOL_YEAR,
                        AcademicPermission.EDIT_SCHOOL_YEAR_INFO,
                        AcademicPermission.UNENROLL_SCHOOL_YEAR,
                        AcademicPermission.PRINT_SCHOOL_YEAR_INFO,
                        AcademicPermission.COLLECT_SCHOOL_YEAR_INFO,
                        AcademicPermission.COLLECT_ALL_SCHOOL_YEARS_INFO,
                        AcademicPermission.VIEW_SCHOOL_YEAR_INFO
                    )
                )
            )
        ),
        PermissionGroup(
            "Gestion des Élèves", "Student Management",
            subGroups = listOf(
                PermissionGroup(
                    "Inscriptions", "Enrollment",
                    permissions = listOf(
                        AcademicPermission.REGISTER_STUDENT,
                        AcademicPermission.ENROLL_STUDENT,
                        AcademicPermission.EDIT_STUDENT_INFO,
                        AcademicPermission.UNENROLL_STUDENT,
                        AcademicPermission.IMPORT_STUDENTS
                    )
                ),
                PermissionGroup(
                    "Suivi & Dossiers", "Tracking & Dossiers",
                    permissions = listOf(
                        AcademicPermission.STUDENT_DOSSIER,
                        AcademicPermission.VIEW_STUDENT_LIST,
                        AcademicPermission.PRINT_STUDENT_INFO,
                        AcademicPermission.PRINT_STUDENT_CARDS,
                        AcademicPermission.PRINT_STUDENT_CARD,
                        AcademicPermission.MANAGE_TUTORSHIP,
                        AcademicPermission.ATTENDANCE_CERTIFICATE,
                        AcademicPermission.EXPORT_PDF_CLASS
                    )
                )
            )
        ),
        PermissionGroup(
            "Notes & Évaluations", "Grades & Evaluations",
            permissions = listOf(
                AcademicPermission.MANAGE_GRADES,
                AcademicPermission.HARMONIZE_GRADES,
                AcademicPermission.VALIDATE_GRADES,
                AcademicPermission.EDIT_STUDENT_NOTE,
                AcademicPermission.GRADES_REPORT_SHEET,
                AcademicPermission.GRADES_COMPLETION_RATE,
                AcademicPermission.PRINT_ANNUAL_REPORT_CARDS
            )
        ),
        PermissionGroup(
            "Discipline & Assiduité", "Discipline & Attendance",
            permissions = listOf(
                AcademicPermission.GLOBAL_ATTENDANCE,
                AcademicPermission.MANAGE_JUSTIFICATIONS,
                AcademicPermission.MANAGE_SANCTIONS,
                AcademicPermission.PERMISSION_REASONS,
                AcademicPermission.EXIT_SLIP
            )
        ),
        PermissionGroup(
            "Finances", "Finance",
            subGroups = listOf(
                PermissionGroup(
                    "Encaissements", "Collections",
                    permissions = listOf(
                        AcademicPermission.COLLECT_REGISTRATION_FEE,
                        AcademicPermission.COLLECT_TUITION_FEE,
                        AcademicPermission.COLLECT_OTHER_FEES,
                        AcademicPermission.PAY_OTHER_FEES,
                        AcademicPermission.PAY_TRANSPORT,
                        AcademicPermission.CANCEL_PAYMENT
                    )
                ),
                PermissionGroup(
                    "Bilans & Rapports", "Reports",
                    permissions = listOf(
                        AcademicPermission.FINANCIAL_BALANCE_SHEET,
                        AcademicPermission.TUITION_BALANCE_SHEET,
                        AcademicPermission.OTHER_FEES_BALANCE_SHEET,
                        AcademicPermission.TRANSPORT_BALANCE_SHEET,
                        AcademicPermission.VIEW_FINANCIAL_REPORTS,
                        AcademicPermission.VIEW_PAYMENT_STATUS,
                        AcademicPermission.VIEW_MY_PAYMENT_STATUS
                    )
                ),
                PermissionGroup(
                    "Paramètres", "Settings",
                    permissions = listOf(
                        AcademicPermission.MANAGE_PAYMENT_MODES,
                        AcademicPermission.MANAGE_BANKS,
                        AcademicPermission.TRANSPORT_RATES
                    )
                )
            )
        ),
        PermissionGroup(
            "Administration & Système", "Admin & System",
            subGroups = listOf(
                PermissionGroup(
                    "Ecole", "School",
                    permissions = listOf(
                        AcademicPermission.REGISTER_SCHOOL,
                        AcademicPermission.ENROLL_SCHOOL,
                        AcademicPermission.EDIT_SCHOOL_INFO,
                        AcademicPermission.UNENROLL_SCHOOL,
                        AcademicPermission.PRINT_SCHOOL_INFO
                    )
                ),
                PermissionGroup(
                    "Utilisateurs", "Users",
                    permissions = listOf(
                        AcademicPermission.MANAGE_USERS,
                        AcademicPermission.REGISTER_USER,
                        AcademicPermission.ENROLL_USER,
                        AcademicPermission.EDIT_USER_INFO,
                        AcademicPermission.UNENROLL_USER,
                        AcademicPermission.PRINT_USER_INFO
                    )
                ),
                PermissionGroup(
                    "Personnel", "Staff",
                    permissions = listOf(
                        AcademicPermission.MANAGE_STAFF,
                        AcademicPermission.STAFF_PLACEMENT,
                        AcademicPermission.MANAGE_FUNCTIONS,
                        AcademicPermission.REGISTER_TEACHER,
                        AcademicPermission.ENROLL_TEACHER,
                        AcademicPermission.EDIT_TEACHER_INFO,
                        AcademicPermission.UNENROLL_TEACHER,
                        AcademicPermission.PRINT_TEACHER_INFO
                    )
                ),
                PermissionGroup(
                    "Maintenance", "Maintenance",
                    permissions = listOf(
                        AcademicPermission.BACKUP_DB,
                        AcademicPermission.RESTORE_DB,
                        AcademicPermission.LOAD_MENUS,
                        AcademicPermission.ACTIVITY_LOGS,
                        AcademicPermission.SESSIONS_CONNECTIONS,
                        AcademicPermission.GENERAL_CONFIG,
                        AcademicPermission.REGISTER_CONFIG,
                        AcademicPermission.EDIT_CONFIG,
                        AcademicPermission.PRINT_CONFIG
                    )
                )
            )
        ),
        PermissionGroup(
            "Communication", "Communication",
            permissions = listOf(
                AcademicPermission.SEND_MESSAGE,
                AcademicPermission.VIEW_MESSAGES,
                AcademicPermission.EDIT_MESSAGE,
                AcademicPermission.DELETE_MESSAGE
            )
        ),
        PermissionGroup(
            "Divers", "Misc",
            permissions = listOf(
                AcademicPermission.EDIT_OWN_ACCOUNT,
                AcademicPermission.CALCULATOR,
                AcademicPermission.ABOUT,
                AcademicPermission.WEB_VERSION,
                AcademicPermission.CHOOSE_BUTTON
            )
        )
    )
}

enum class AcademicRole(
    val permissions: Set<AcademicPermission>,
    val icon: ImageVector,
    val color: Color
) {
    ADMINISTRATEUR(AcademicPermission.entries.toSet(), Icons.Default.AdminPanelSettings, Color(0xFFE74C3C)),
    FONDATEUR(setOf(
        AcademicPermission.DASHBOARD_ETABLISSEMENT,
        AcademicPermission.WEB_VERSION,
        AcademicPermission.ACADEMIC_STATS,
        AcademicPermission.FINANCIAL_BALANCE_SHEET,
        AcademicPermission.PRINT_SCHOOL_INFO,
        AcademicPermission.SUMMARY
    ), Icons.Default.Business, Color(0xFFF1C40F)),
    DIRECTEUR(setOf(
        AcademicPermission.DASHBOARD_ETABLISSEMENT,
        AcademicPermission.WEB_VERSION,
        AcademicPermission.ACADEMIC_STATS,
        AcademicPermission.VIEW_STUDENT_LIST,
        AcademicPermission.STUDENT_DOSSIER,
        AcademicPermission.MANAGE_ACADEMIC_CONFIG,
        AcademicPermission.VALIDATE_GRADES,
        AcademicPermission.GRADES_REPORT_SHEET,
        AcademicPermission.GLOBAL_ATTENDANCE,
        AcademicPermission.SUMMARY
    ), Icons.Default.ManageAccounts, Color(0xFF3498DB)),
    VICE_PRINCIPAL(emptySet(), Icons.Default.SupervisorAccount, Color(0xFF2980B9)),
    DIRECTEUR_DES_ETUDES(setOf(
        AcademicPermission.DASHBOARD_ETABLISSEMENT,
        AcademicPermission.WEB_VERSION,
        AcademicPermission.MANAGE_ACADEMIC_CONFIG,
        AcademicPermission.MANAGE_GRADES,
        AcademicPermission.VALIDATE_GRADES,
        AcademicPermission.GRADES_REPORT_SHEET,
        AcademicPermission.VIEW_STUDENT_LIST,
        AcademicPermission.ACADEMIC_STATS
    ), Icons.Default.MenuBook, Color(0xFF1ABC9C)),
    INTENDANT(setOf(
        AcademicPermission.DASHBOARD_ETABLISSEMENT,
        AcademicPermission.WEB_VERSION,
        AcademicPermission.COLLECT_TUITION_FEE,
        AcademicPermission.COLLECT_REGISTRATION_FEE,
        AcademicPermission.COLLECT_OTHER_FEES,
        AcademicPermission.VIEW_FINANCIAL_REPORTS,
        AcademicPermission.FINANCIAL_BALANCE_SHEET,
        AcademicPermission.VIEW_PAYMENT_STATUS
    ), Icons.Default.Payments, Color(0xFF27AE60)),
    SECRETAIRE(setOf(
        AcademicPermission.DASHBOARD_ETABLISSEMENT,
        AcademicPermission.WEB_VERSION,
        AcademicPermission.REGISTER_STUDENT,
        AcademicPermission.ENROLL_STUDENT,
        AcademicPermission.VIEW_STUDENT_LIST,
        AcademicPermission.STUDENT_DOSSIER,
        AcademicPermission.PRINT_STUDENT_INFO,
        AcademicPermission.ATTENDANCE_CERTIFICATE
    ), Icons.Default.AppRegistration, Color(0xFF95A5A6)),
    SURVEILLANT_GENERAL(setOf(
        AcademicPermission.DASHBOARD_ETABLISSEMENT,
        AcademicPermission.WEB_VERSION,
        AcademicPermission.VIEW_STUDENT_LIST,
        AcademicPermission.STUDENT_DOSSIER,
        AcademicPermission.GLOBAL_ATTENDANCE,
        AcademicPermission.MANAGE_JUSTIFICATIONS,
        AcademicPermission.MANAGE_SANCTIONS,
        AcademicPermission.EXIT_SLIP
    ), Icons.Default.Policy, Color(0xFFD35400)),
    CHEF_DE_DEPARTEMENT(emptySet(), Icons.Default.Groups, Color(0xFF8E44AD)),
    ENSEIGNANT(setOf(
        AcademicPermission.DASHBOARD_ETABLISSEMENT,
        AcademicPermission.WEB_VERSION,
        AcademicPermission.MANAGE_GRADES,
        AcademicPermission.EDIT_STUDENT_NOTE,
        AcademicPermission.GRADES_REPORT_SHEET,
        AcademicPermission.SUMMARY
    ), Icons.Default.School, Color(0xFF2980B9)),
    CONSEILLER_ORIENTATION(emptySet(), Icons.Default.Psychology, Color(0xFF16A085)),
    INFIRMIER(emptySet(), Icons.Default.LocalHospital, Color(0xFFC0392B)),
    PARENT(emptySet(), Icons.Default.FamilyRestroom, Color(0xFF34495E)),
    ELEVE(emptySet(), Icons.Default.Person, Color(0xFF7F8C8D)),
    AGENT_ENTRETIEN(emptySet(), Icons.Default.CleaningServices, Color(0xFFBDC3C7)),
    PERSONNEL_CANTINE(emptySet(), Icons.Default.Restaurant, Color(0xFFE67E22)),

    DEMANDEUR(emptySet(), Icons.Default.Pending, Color.Gray),
    SANS_ROLE(emptySet(), Icons.Default.Person, Color.Gray);


    companion object {
        fun fromName(name: String?): AcademicRole {
            if (name.isNullOrBlank()) return SANS_ROLE
            return entries.find { it.name.equals(name, ignoreCase = true) } ?: DEMANDEUR
        }
    }
}
