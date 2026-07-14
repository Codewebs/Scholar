const { MatiereBibliotheque, Country, Enseignement } = require("../models");

const LIBRARY_DATA = [
    {
        country: "Cameroun",
        enseignement: "Enseignement Secondaire Général",
        matieres: [
            { libelleFr: "Mathématiques", abreviation: "MATH" },
            { libelleFr: "Physique", abreviation: "PHYS" },
            { libelleFr: "Chimie", abreviation: "CHIM" },
            { libelleFr: "Sciences de la Vie et de la Terre", abreviation: "SVT" },
            { libelleFr: "Français", abreviation: "FRAN" },
            { libelleFr: "Anglais", abreviation: "ANGL" },
            { libelleFr: "Histoire", abreviation: "HIST" },
            { libelleFr: "Géographie", abreviation: "GEO" },
            { libelleFr: "Éducation à la Citoyenneté", abreviation: "ECM" },
            { libelleFr: "Informatique", abreviation: "INFO" },
            { libelleFr: "Philosophie", abreviation: "PHILO" }
        ]
    },
    {
        country: "Cameroun",
        enseignement: "Enseignement Technique et Professionnel",
        matieres: [
            { libelleFr: "Mathématiques", abreviation: "MATH" },
            { libelleFr: "Français", abreviation: "FRAN" },
            { libelleFr: "Anglais", abreviation: "ANGL" },
            { libelleFr: "Dessin Technique", abreviation: "DESS" },
            { libelleFr: "Technologie", abreviation: "TECH" },
            { libelleFr: "Comptabilité", abreviation: "COMPTA" },
            { libelleFr: "Économie", abreviation: "ECO" }
        ]
    },
    {
        country: "Cameroun",
        enseignement: "Enseignement Maternel et Primaire",
        matieres: [
            { libelleFr: "Calcul", abreviation: "CALC" },
            { libelleFr: "Langage", abreviation: "LANG" },
            { libelleFr: "Écriture", abreviation: "ECRI" },
            { libelleFr: "Dessin", abreviation: "DESS" },
            { libelleFr: "Chant", abreviation: "CHAN" },
            { libelleFr: "Activités Pratiques", abreviation: "ACTP" }
        ]
    }
];

async function seedMatiereBibliotheque() {
    console.log("📚 [Seeder] Initialisation de la bibliothèque de matières...");
    try {
        for (const entry of LIBRARY_DATA) {
            const country = await Country.findOne({ where: { nomPays: entry.country } });
            if (!country) continue;

            const enseignement = await Enseignement.findOne({
                where: { enseignementFr: entry.enseignement, idCountry: country.idCountry }
            });
            if (!enseignement) continue;

            for (const mat of entry.matieres) {
                await MatiereBibliotheque.findOrCreate({
                    where: {
                        libelleFr: mat.libelleFr,
                        idEnseignement: enseignement.idEnseignement,
                        idCountry: country.idCountry
                    },
                    defaults: {
                        abreviation: mat.abreviation,
                        libelleEn: mat.libelleEn || mat.libelleFr // Fallback
                    }
                });
            }
        }
        console.log("✅ [Seeder] Bibliothèque de matières prête.");
    } catch (error) {
        console.error("❌ [Seeder] Erreur library matieres:", error);
    }
}

module.exports = seedMatiereBibliotheque;
