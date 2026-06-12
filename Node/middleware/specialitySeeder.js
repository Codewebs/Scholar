const { Specialite } = require("../models");

const seedSpecialities = async () => {
  try {
    const count = await Specialite.count();
    if (count === 0) {
      const specialities = [
        { libelle: "Mathématiques", type: "MATIERE" },
        { libelle: "Français", type: "MATIERE" },
        { libelle: "Physique-Chimie", type: "MATIERE" },
        { libelle: "SVT", type: "MATIERE" },
        { libelle: "Anglais", type: "MATIERE" },
        { libelle: "Histoire-Géo", type: "MATIERE" },
        { libelle: "Informatique", type: "MATIERE" },
        { libelle: "Philosophie", type: "MATIERE" },
        { libelle: "Gestion de classe", type: "COMPETENCE_PRO" },
        { libelle: "Pédagogie différenciée", type: "COMPETENCE_PRO" },
        { libelle: "Utilisation TICE", type: "COMPETENCE_PRO" },
        { libelle: "Psychologie de l'enfant", type: "COMPETENCE_PRO" }
      ];
      await Specialite.bulkCreate(specialities);
      console.log("✅ Spécialités initialisées.");
    }
  } catch (error) {
    console.error("❌ Erreur seeding spécialités :", error);
  }
};

module.exports = seedSpecialities;
