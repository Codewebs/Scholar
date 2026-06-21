const sequelize = require("../db");
const Utilisateur = require("./utilisateur");
const Qualite = require("./qualite");
const Menu = require("./menu");
const AutorisationUtilisateur = require("./autorisation_utilisateur");
const AnneeScolaire = require("./anneeScolaire");
const Etablissement = require("./etablissement");
const EtablissementStructure = require("./etablissementStructure");
const Enseignement = require("./enseignement");
const Country = require("./country");
const Cycle = require("./cycle");
const Classe = require("./classe");
const Salle = require("./salle");
const Eleve = require("./eleve");
const Inscription = require("./inscription");
const Matiere = require("./matiere");
const GroupeMatiere = require("./groupeMatiere");
const Periode = require("./periode");
const SousPeriode = require("./sousPeriode");
const Competence = require("./competence");
const RepartitionMatiere = require("./repartitionMatiere");
const RepartitionSousPeriode = require("./repartitionSousPeriode");
const RepartitionCompetence = require("./repartitionCompetence");
const Note = require("./note");
const Justification = require("./justification");
const SuiviAbsence = require("./suiviAbsence");
const Annonce = require("./Annonce");
const Specialite = require("./Specialite");
const UtilisateurSpecialite = require("./UtilisateurSpecialite");

// Personnel Models
const InscriptionPersonnel = require("./inscriptionPersonnel");
const DemandeInscriptionPersonnel = require("./demandeInscriptionPersonnel");
const CompetenceEnseignant = require("./competenceEnseignant");
const AffectationPersonnelSalle = require("./affectationPersonnelSalle");

// Finance Models
const FraisExigible = require("./fraisExigible");
const TarifFraisExigible = require("./tarifFraisExigible");
const FraisActivitePeriscolaire = require("./fraisActivitePeriscolaire");
const TarifFraisPeriscolaire = require("./tarifFraisPeriscolaire");
const PaiementFraisGlobal = require("./paiementFraisGlobal");
const PaiementFraisExigible = require("./paiementFraisExigible");
const PaiementFraisPeriscolaire = require("./paiementFraisPeriscolaire");
const Quartier = require("./quartier");
const TarifTransport = require("./tarifTransport");
const EleveTransport = require("./eleveTransport");
const EcheancierTransport = require("./echeancierTransport");
const PaiementTransport = require("./paiementTransport");

// ✅ Associations fondamentales
Utilisateur.belongsTo(Qualite, { foreignKey: "idQualite" });
Qualite.hasMany(Utilisateur, { foreignKey: "idQualite" });

Utilisateur.hasMany(AutorisationUtilisateur, { foreignKey: "idUtilisateur" });
Menu.hasMany(AutorisationUtilisateur, { foreignKey: "idMenu" });

AutorisationUtilisateur.belongsTo(Utilisateur, { foreignKey: "idUtilisateur" });
AutorisationUtilisateur.belongsTo(Menu, { foreignKey: "idMenu" });

// ✅ Structure Template (Bibliothèque globale)
Country.hasMany(Enseignement, { foreignKey: "idCountry" });
Enseignement.belongsTo(Country, { foreignKey: "idCountry" });

Enseignement.hasMany(Cycle, { foreignKey: "idEnseignement", as: "cycles" });
Cycle.belongsTo(Enseignement, { foreignKey: "idEnseignement", as: "Enseignement" });

Cycle.hasMany(Classe, { foreignKey: "idCycle", as: "classes" });
Classe.belongsTo(Cycle, { foreignKey: "idCycle", as: "Cycle" });

// ✅ Instance Etablissement
Etablissement.hasMany(AnneeScolaire, { foreignKey: "idEtablissement" });
AnneeScolaire.belongsTo(Etablissement, { foreignKey: "idEtablissement" });

Etablissement.hasMany(EtablissementStructure, { foreignKey: "idEtablissement" });
EtablissementStructure.belongsTo(Etablissement, { foreignKey: "idEtablissement" });

AnneeScolaire.hasMany(EtablissementStructure, { foreignKey: "idAnneeScolaire" });
EtablissementStructure.belongsTo(AnneeScolaire, { foreignKey: "idAnneeScolaire" });

Etablissement.hasMany(GroupeMatiere, { foreignKey: "idEtablissement" });
GroupeMatiere.belongsTo(Etablissement, { foreignKey: "idEtablissement" });

Enseignement.hasMany(EtablissementStructure, { foreignKey: "idEnseignement" });
EtablissementStructure.belongsTo(Enseignement, { foreignKey: "idEnseignement" });

Etablissement.belongsTo(Utilisateur, { foreignKey: "idCreateur", as: "createur" });

// Les salles sont liées à l'établissement et à une année (pour le filtrage/synchro)
Classe.hasMany(Salle, { foreignKey: "idClasse", as: "salles" });
Salle.belongsTo(Classe, { foreignKey: "idClasse", as: "Classe" });

AnneeScolaire.hasMany(Salle, { foreignKey: "idAnneeScolaire" });
Salle.belongsTo(AnneeScolaire, { foreignKey: "idAnneeScolaire" });

Etablissement.hasMany(Salle, { foreignKey: "idEtablissement" });
Salle.belongsTo(Etablissement, { foreignKey: "idEtablissement" });

// ✅ Pedagogie & Répartition
AnneeScolaire.hasMany(Periode, { foreignKey: "idAnneeScolaire", as: "periodes" });
Periode.belongsTo(AnneeScolaire, { foreignKey: "idAnneeScolaire" });

Periode.hasMany(SousPeriode, { foreignKey: "idPeriode", as: "sousPeriodes" });
SousPeriode.belongsTo(Periode, { foreignKey: "idPeriode" });

AnneeScolaire.hasMany(RepartitionSousPeriode, { foreignKey: "idAnneeScolaire" });
RepartitionSousPeriode.belongsTo(AnneeScolaire, { foreignKey: "idAnneeScolaire" });

Classe.hasMany(RepartitionSousPeriode, { foreignKey: "idClasse", as: "repartitionSequences" });
RepartitionSousPeriode.belongsTo(Classe, { foreignKey: "idClasse" });

SousPeriode.hasMany(RepartitionSousPeriode, { foreignKey: "idSousPeriode" });
RepartitionSousPeriode.belongsTo(SousPeriode, { foreignKey: "idSousPeriode" });

AnneeScolaire.hasMany(RepartitionMatiere, { foreignKey: "idAnneeScolaire" });
RepartitionMatiere.belongsTo(AnneeScolaire, { foreignKey: "idAnneeScolaire" });

Classe.hasMany(RepartitionMatiere, { foreignKey: "idClasse" });
RepartitionMatiere.belongsTo(Classe, { foreignKey: "idClasse" });

Matiere.hasMany(RepartitionMatiere, { foreignKey: "idMatiere" });
RepartitionMatiere.belongsTo(Matiere, { foreignKey: "idMatiere" });

GroupeMatiere.hasMany(RepartitionMatiere, { foreignKey: "idGroupeMatiere" });
RepartitionMatiere.belongsTo(GroupeMatiere, { foreignKey: "idGroupeMatiere" });

RepartitionMatiere.hasMany(RepartitionCompetence, { foreignKey: "idRepartitionMatiere" });
RepartitionCompetence.belongsTo(RepartitionMatiere, { foreignKey: "idRepartitionMatiere" });

Competence.hasMany(RepartitionCompetence, { foreignKey: "idCompetence" });
RepartitionCompetence.belongsTo(Competence, { foreignKey: "idCompetence" });

SousPeriode.hasMany(RepartitionCompetence, { foreignKey: "idSousPeriode" });
RepartitionCompetence.belongsTo(SousPeriode, { foreignKey: "idSousPeriode" });

// ✅ Inscriptions et Éleves
Eleve.hasMany(Inscription, { foreignKey: "idEleve" });
Inscription.belongsTo(Eleve, { foreignKey: "idEleve" });

AnneeScolaire.hasMany(Inscription, { foreignKey: "idAnneeScolaire" });
Inscription.belongsTo(AnneeScolaire, { foreignKey: "idAnneeScolaire" });

Salle.hasMany(Inscription, { foreignKey: "idSalle" });
Inscription.belongsTo(Salle, { foreignKey: "idSalle" });

// ✅ Personnel Associations
Utilisateur.hasMany(InscriptionPersonnel, { foreignKey: "idUtilisateur" });
InscriptionPersonnel.belongsTo(Utilisateur, { foreignKey: "idUtilisateur" });

AnneeScolaire.hasMany(InscriptionPersonnel, { foreignKey: "idAnneeScolaire" });
InscriptionPersonnel.belongsTo(AnneeScolaire, { foreignKey: "idAnneeScolaire" });

Etablissement.hasMany(InscriptionPersonnel, { foreignKey: "idEtablissement" });
InscriptionPersonnel.belongsTo(Etablissement, { foreignKey: "idEtablissement" });

Utilisateur.hasMany(DemandeInscriptionPersonnel, { foreignKey: "idUtilisateur" });
DemandeInscriptionPersonnel.belongsTo(Utilisateur, { foreignKey: "idUtilisateur" });

Etablissement.hasMany(DemandeInscriptionPersonnel, { foreignKey: "idEtablissement" });
DemandeInscriptionPersonnel.belongsTo(Etablissement, { foreignKey: "idEtablissement" });

InscriptionPersonnel.belongsToMany(Matiere, {
  through: CompetenceEnseignant,
  foreignKey: "idInscriptionPersonnel",
  as: "specialites"
});
Matiere.belongsToMany(InscriptionPersonnel, {
  through: CompetenceEnseignant,
  foreignKey: "idMatiere"
});

InscriptionPersonnel.hasMany(AffectationPersonnelSalle, { foreignKey: "idInscriptionPersonnel" });
AffectationPersonnelSalle.belongsTo(InscriptionPersonnel, { foreignKey: "idInscriptionPersonnel" });

Salle.hasMany(AffectationPersonnelSalle, { foreignKey: "idSalle" });
AffectationPersonnelSalle.belongsTo(Salle, { foreignKey: "idSalle" });

Matiere.hasMany(AffectationPersonnelSalle, { foreignKey: "idMatiere" });
AffectationPersonnelSalle.belongsTo(Matiere, { foreignKey: "idMatiere" });

// ✅ Finance Associations
TarifFraisExigible.belongsTo(FraisExigible, { foreignKey: "idFraisExigible", as: "Frais" });
FraisExigible.hasMany(TarifFraisExigible, { foreignKey: "idFraisExigible" });

TarifFraisExigible.belongsTo(Classe, { foreignKey: "idClasse" });
Classe.hasMany(TarifFraisExigible, { foreignKey: "idClasse" });

TarifFraisExigible.belongsTo(AnneeScolaire, { foreignKey: "idAnneeScolaire" });
AnneeScolaire.hasMany(TarifFraisExigible, { foreignKey: "idAnneeScolaire" });

TarifFraisPeriscolaire.belongsTo(FraisActivitePeriscolaire, { foreignKey: "idFraisActivitePeriscolaire", as: "Frais" });
FraisActivitePeriscolaire.hasMany(TarifFraisPeriscolaire, { foreignKey: "idFraisActivitePeriscolaire" });

PaiementFraisGlobal.belongsTo(Eleve, { foreignKey: "idEleve" });
Eleve.hasMany(PaiementFraisGlobal, { foreignKey: "idEleve" });

PaiementFraisGlobal.belongsTo(Utilisateur, { foreignKey: "idCaissier", as: "Caissier" });
Utilisateur.hasMany(PaiementFraisGlobal, { foreignKey: "idCaissier" });

PaiementFraisGlobal.hasMany(PaiementFraisExigible, { foreignKey: "idPaiementFraisGlobal", as: "detailsExigibles" });
PaiementFraisExigible.belongsTo(PaiementFraisGlobal, { foreignKey: "idPaiementFraisGlobal" });

PaiementFraisExigible.belongsTo(TarifFraisExigible, { foreignKey: "idTarifFraisExigible", as: "Tarif" });

PaiementFraisGlobal.hasMany(PaiementFraisPeriscolaire, { foreignKey: "idPaiementFraisGlobal", as: "detailsPeriscolaires" });
PaiementFraisPeriscolaire.belongsTo(PaiementFraisGlobal, { foreignKey: "idPaiementFraisGlobal" });

PaiementFraisPeriscolaire.belongsTo(TarifFraisPeriscolaire, { foreignKey: "idTarifFraisActivitePeriscolaire", as: "Tarif" });

TarifTransport.belongsTo(Quartier, { foreignKey: "idQuartier" });
Quartier.hasMany(TarifTransport, { foreignKey: "idQuartier" });

Eleve.hasMany(EleveTransport, { foreignKey: "idEleve" });
EleveTransport.belongsTo(Eleve, { foreignKey: "idEleve" });

TarifTransport.hasMany(EleveTransport, { foreignKey: "idTarifTransport" });
EleveTransport.belongsTo(TarifTransport, { foreignKey: "idTarifTransport" });

EleveTransport.hasMany(EcheancierTransport, { foreignKey: "idEleveTransport", as: "echeances" });
EcheancierTransport.belongsTo(EleveTransport, { foreignKey: "idEleveTransport" });

PaiementFraisGlobal.hasMany(PaiementTransport, { foreignKey: "idPaiementFraisGlobal", as: "detailsTransport" });
PaiementTransport.belongsTo(PaiementFraisGlobal, { foreignKey: "idPaiementFraisGlobal" });

PaiementTransport.belongsTo(EcheancierTransport, { foreignKey: "idEcheancier" });
EcheancierTransport.hasMany(PaiementTransport, { foreignKey: "idEcheancier" });

PaiementTransport.belongsTo(EleveTransport, { foreignKey: "idEleveTransport" });
EleveTransport.hasMany(PaiementTransport, { foreignKey: "idEleveTransport" });

// ✅ Pedagogical (Grades) Associations
Note.belongsTo(AnneeScolaire, { foreignKey: "idAnneeScolaire" });
AnneeScolaire.hasMany(Note, { foreignKey: "idAnneeScolaire" });

Note.belongsTo(Inscription, { foreignKey: "idInscription" });
Inscription.hasMany(Note, { foreignKey: "idInscription" });

Note.belongsTo(RepartitionCompetence, { foreignKey: "idRepartitionCompetence" });
RepartitionCompetence.hasMany(Note, { foreignKey: "idRepartitionCompetence" });

Note.belongsTo(SousPeriode, { foreignKey: "idSequence" });
SousPeriode.hasMany(Note, { foreignKey: "idSequence" });

Note.belongsTo(Justification, { foreignKey: "idJustification" });
Justification.hasMany(Note, { foreignKey: "idJustification" });

// ✅ Absences
SuiviAbsence.belongsTo(Inscription, { foreignKey: "idInscription" });
Inscription.hasMany(SuiviAbsence, { foreignKey: "idInscription" });

SuiviAbsence.belongsTo(AnneeScolaire, { foreignKey: "idAnneeScolaire" });
AnneeScolaire.hasMany(SuiviAbsence, { foreignKey: "idAnneeScolaire" });

SuiviAbsence.belongsTo(SousPeriode, { foreignKey: "idSequence" });
SousPeriode.hasMany(SuiviAbsence, { foreignKey: "idSequence" });

// ✅ Annonces
Annonce.belongsTo(Utilisateur, { foreignKey: "idAuteur", as: "auteur" });
Utilisateur.hasMany(Annonce, { foreignKey: "idAuteur" });

Annonce.belongsTo(Etablissement, { foreignKey: "idEtablissement", as: "etablissement" });
Etablissement.hasMany(Annonce, { foreignKey: "idEtablissement" });

// ✅ Spécialités Utilisateur
Utilisateur.belongsToMany(Specialite, {
  through: UtilisateurSpecialite,
  foreignKey: "idUtilisateur",
  as: "specialites"
});
Specialite.belongsToMany(Utilisateur, {
  through: UtilisateurSpecialite,
  foreignKey: "idSpecialite"
});

module.exports = {
  sequelize,
  Utilisateur,
  Qualite,
  Menu,
  AutorisationUtilisateur,
  AnneeScolaire,
  Etablissement,
  EtablissementStructure,
  Enseignement,
  Country,
  Cycle,
  Classe,
  Salle,
  Eleve,
  Inscription,
  Matiere,
  GroupeMatiere,
  Periode,
  SousPeriode,
  Competence,
  RepartitionMatiere,
  RepartitionSousPeriode,
  RepartitionCompetence,
  Note,
  Justification,
  SuiviAbsence,
  Annonce,
  Specialite,
  UtilisateurSpecialite,
  InscriptionPersonnel,
  DemandeInscriptionPersonnel,
  CompetenceEnseignant,
  AffectationPersonnelSalle,
  FraisExigible,
  TarifFraisExigible,
  FraisActivitePeriscolaire,
  TarifFraisPeriscolaire,
  PaiementFraisGlobal,
  PaiementFraisExigible,
  PaiementFraisPeriscolaire,
  Quartier,
  TarifTransport,
  EleveTransport,
  EcheancierTransport,
  PaiementTransport
};
