const Qualite = require("../models/qualite");
const QUALITES = require("../constants/qualites");

async function seedQualites() {
  console.log("🌱 [Seeder] Vérification des qualités...");
  for (const q of QUALITES) {
    const exists = await Qualite.findOne({ where: { libelleQualite: q } });
    if (!exists) {
      await Qualite.create({ libelleQualite: q });
      console.log(`➡️ Qualité ajoutée : ${q}`);
    }
  }
  console.log("✔️ Vérification des qualités terminée.");
}

module.exports = seedQualites;
