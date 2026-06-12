const { Country, Enseignement, Cycle, Classe } = require("../models");
const EducationProfiles = require("../constants/educationProfiles");

async function seedEducationProfiles() {
  console.log("🌱 [Seeder] Vérification des profils d'éducation...");

  try {
    for (const countryData of EducationProfiles.countries) {
      // 1. Gérer le Pays
      let [country] = await Country.findOrCreate({
        where: { nomPays: countryData.nomPays }
      });

      for (const profil of countryData.profils) {
        // 2. Gérer l'Enseignement (Profil)
        let [enseignement] = await Enseignement.findOrCreate({
          where: {
            enseignementFr: profil.enseignementLibelles.fr,
            idCountry: country.idCountry
          },
          defaults: {
            enseignementEn: profil.enseignementLibelles.en,
            enseignementEs: profil.enseignementLibelles.es,
            abreviation: profil.nomProfil.substring(0, 10)
          }
        });

        for (const cycleData of profil.cycles) {
          // 3. Gérer le Cycle
          let [cycle] = await Cycle.findOrCreate({
            where: {
              libelleCycle: cycleData.libelles.fr,
              idEnseignement: enseignement.idEnseignement
            },
            defaults: {
              libelleCycleEn: cycleData.libelles.en,
              libelleCycleEs: cycleData.libelles.es,
              ordre: 1
            }
          });

          for (const classeData of cycleData.classes) {
            // 4. Gérer la Classe
            await Classe.findOrCreate({
              where: {
                libelleClasseFr: classeData.libelles.fr,
                idCycle: cycle.idCycle
              },
              defaults: {
                libelleClasseEn: classeData.libelles.en,
                libelleClasseEs: classeData.libelles.es,
                abreviation: classeData.abreviation,
                ordre: 1
              }
            });
          }
        }
      }
    }
    console.log("✅ [Seeder] Profils d'éducation initialisés.");
  } catch (error) {
    console.error("❌ [Seeder] Erreur lors du seeding des profils :", error);
  }
}

module.exports = seedEducationProfiles;
