const Menu = require("../models/Menu");

const MENUS = [
  { libelleMenu: "Tableau de bord établissement" },
  { libelleMenu: "Journal d’activité (logs)" },
  { libelleMenu: "Sessions & connexions" },
  { libelleMenu: "Gestion des niveaux" },
  { libelleMenu: "Gestion des filières (si utilisée)" },
  { libelleMenu: "Importation élèves (Excel/CSV)" },
  { libelleMenu: "Dossier élève (fiche individuelle)" },
  { libelleMenu: "Harmonisation des notes" },
  { libelleMenu: "Validation des notes par chef d’établissement" },
  { libelleMenu: "Statistiques de réussite scolaire" },
  { libelleMenu: "Taux de complétion des notes" },
  { libelleMenu: "Présences / Absences globales" },
  { libelleMenu: "Attestation de fréquentation" },
  { libelleMenu: "Export PDF de classe / matière" },
  { libelleMenu: "Séquences" },
  { libelleMenu: "Trimestres" },
  { libelleMenu: "Périodes" },
  { libelleMenu: "Sous périodes" },
  { libelleMenu: "Utilisateurs" },
  { libelleMenu: "Sauvegarder BD" },
  { libelleMenu: "Restaurer BD" },
  { libelleMenu: "Charger menus" },
  { libelleMenu: "Modification de son compte" },
  { libelleMenu: "Cycle/Section" },
  { libelleMenu: "Classe" },
  { libelleMenu: "Salle de classe" },
  { libelleMenu: "Mode paiement" },
  { libelleMenu: "Banque" },
  { libelleMenu: "Quartier/Secteur" },
  { libelleMenu: "Mois" },
  { libelleMenu: "Tarifs mensuels Transport" },
  { libelleMenu: "Fonction" },
  { libelleMenu: "Grade" },
  { libelleMenu: "Enseignant/Personnel" },
  { libelleMenu: "Paiement autres frais" },
  { libelleMenu: "Paiement transport" },
  { libelleMenu: "Justifications" },
  { libelleMenu: "Fiche de report des notes" },
  { libelleMenu: "Impression bulletins Annuel" },
  { libelleMenu: "Cartes Scolaire par salle de classe" },
  { libelleMenu: "Bilan des encaissements" },
  { libelleMenu: "Effectif/Salle de classe" },
  { libelleMenu: "Bilan frais scolaires" },
  { libelleMenu: "Bilan autres frais" },
  { libelleMenu: "Bilan transports" },
  { libelleMenu: "Bordereau de Sortie/Quartier" },
  { libelleMenu: "Mise en place du personnel" },
  { libelleMenu: "Calculatrice" },
  { libelleMenu: "A propos de..." },
  { libelleMenu: "Sommaire..." },
  { libelleMenu: "Version Web" },
  { libelleMenu: "Bouton choisir" },
  { libelleMenu: "Effectif Nouveau/Ancien" },
  { libelleMenu: "Etat global des encaissements des frais scolaires par classe" },
  { libelleMenu: "Sanctions" },
  { libelleMenu: "Motifs de permission" },
  { libelleMenu: "Histogramme des effectifs/Cycle" },
  { libelleMenu: "Configuration generale" },
  { libelleMenu: "Tutelle" },
  { libelleMenu: "Tutelle" },
  { libelleMenu: "Tutelle" },
];

async function seedMenus() {
  for (const menu of MENUS) {
    const exists = await Menu.findOne({ where: { libelleMenu: menu.libelleMenu } });
    if (!exists) {
      await Menu.create(menu);
      console.log(`➡️ Menu ajouté : ${menu.libelleMenu}`);
    }
  }
  console.log("✔️ Vérification des menus terminée.");
}

module.exports = seedMenus;
