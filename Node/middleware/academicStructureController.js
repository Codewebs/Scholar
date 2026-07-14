const { Enseignement, Cycle, Classe, EtablissementStructure, AnneeScolaire, sequelize } = require("../models");
const { Op } = require("sequelize");

exports.createStructure = async (req, res) => {
    console.log("🏗️ [AcademicStructure] Enregistrement des profils choisis...");
    const t = await sequelize.transaction();
    try {
        const { idAnneeScolaire, selectedEnseignements, nomPays, nomProfil, enseignementFr, enseignementEn, enseignementEs, structure } = req.body;
        console.log("📦 Body reçu:", JSON.stringify(req.body, null, 2));

        const annee = await AnneeScolaire.findByPk(idAnneeScolaire);
        if (!annee) throw new Error("Année introuvable");

        // CAS 1 : Sélection de profils existants (Templates)
        if (selectedEnseignements && selectedEnseignements.length > 0) {
            console.log("🔗 Liaison de profils existants:", selectedEnseignements);
            for (const idEns of selectedEnseignements) {
                const ensTemplate = await Enseignement.findByPk(idEns);
                if (!ensTemplate) {
                    console.warn(`⚠️ Template ${idEns} introuvable`);
                    continue;
                }

                // Utilisation de findOrCreate pour accumuler sans écraser ni dupliquer
                await EtablissementStructure.findOrCreate({
                    where: {
                        idEtablissement: annee.idEtablissement,
                        idAnneeScolaire,
                        idEnseignement: idEns
                    },
                    defaults: { idCountry: ensTemplate.idCountry },
                    transaction: t
                });
            }
        }
        // CAS 2 : Génération d'une structure personnalisée
        else if (nomPays && structure) {
            console.log(`✨ Création d'une structure personnalisée pour ${nomPays}`);

            const [country] = await Country.findOrCreate({
                where: { nomPays },
                transaction: t
            });

            const newEns = await Enseignement.create({
                idCountry: country.idCountry,
                enseignementFr: enseignementFr || nomProfil,
                enseignementEn: enseignementEn,
                enseignementEs: enseignementEs,
                abreviation: nomProfil?.substring(0, 10)
            }, { transaction: t });

            for (const cycleData of structure) {
                const newCycle = await Cycle.create({
                    idEnseignement: newEns.idEnseignement,
                    libelleCycle: cycleData.libelleFr, // Mappage vers le champ libelleCycle de la DB
                    libelleCycleEn: cycleData.libelleEn,
                    libelleCycleEs: cycleData.libelleEs,
                    ordre: 1
                }, { transaction: t });

                for (const classeData of cycleData.classes) {
                    await Classe.create({
                        idCycle: newCycle.idCycle,
                        libelleClasseFr: classeData.libelleFr, // Mappage vers le champ libelleClasse de la DB
                        libelleClasseEn: classeData.libelleEn,
                        libelleClasseEs: classeData.libelleEs,
                        abreviation: classeData.abreviation,
                        ordre: 1
                    }, { transaction: t });
                }
            }

            // 4. Liaison à l'établissement (avec findOrCreate pour accumuler sans doublons)
            await EtablissementStructure.findOrCreate({
                where: {
                    idEtablissement: annee.idEtablissement,
                    idAnneeScolaire,
                    idEnseignement: newEns.idEnseignement
                },
                defaults: { idCountry: country.idCountry },
                transaction: t
            });
        }

        await t.commit();
        res.status(201).json({ message: "Configuration enregistrée avec succès" });
    } catch (error) {
        if (t) await t.rollback();
        console.error("❌ Erreur createStructure:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.getStructureByAnnee = async (req, res) => {
  try {
    const { idAnneeScolaire } = req.params;
    console.log(`\n🔍 [AcademicStructure] >>> Requête GET Structure pour l'année: ${idAnneeScolaire}`);

    // On cherche les profils liés à cette année
    const configurations = await EtablissementStructure.findAll({
        where: { idAnneeScolaire: idAnneeScolaire }
    });

    console.log(`📊 [AcademicStructure] Configurations trouvées dans etablissement_structure: ${configurations.length}`);
    if (configurations.length > 0) {
        console.log(`🔗 IDs Enseignement liés: ${configurations.map(c => c.idEnseignement).join(', ')}`);
    }

    if (configurations.length === 0) {
        console.log(`⚠️ [AcademicStructure] Aucun profil configuré pour cette année.`);
        return res.status(200).json([]);
    }

    const idsEnseignement = configurations.map(c => c.idEnseignement);

    const enseignementTemplates = await Enseignement.findAll({
      where: { idEnseignement: idsEnseignement },
      include: [{
        model: Cycle,
        as: "cycles",
        include: [{
          model: Classe,
          as: "classes"
        }]
      }]
    });

    // On injecte l'idAnneeScolaire et on normalise les noms de champs pour le DTO Android
    const result = enseignementTemplates.map(ens => {
        const json = ens.toJSON();
        return {
            ...json,
            idAnneeScolaire: parseInt(idAnneeScolaire),
            cycles: (json.cycles || []).map(cyc => ({
                ...cyc,
                libelleCycleFr: cyc.libelleCycle, // Normalisation pour Moshi (Android)
                classes: (cyc.classes || []).map(cl => ({
                    ...cl,
                    libelleClasseFr: cl.libelleClasseFr // Normalisation pour Moshi (Android)
                }))
            }))
        };
    });

    console.log(`✅ [AcademicStructure] <<< Envoi de ${result.length} profils complets.`);
    result.forEach(p => console.log(`   - Profil: ${p.enseignementFr} (${p.cycles?.length || 0} cycles)`));

    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ [AcademicStructure] Erreur getStructureByAnnee:", error);
    return res.status(500).json({ error: error.message });
  }
};


exports.getAllCyclesByAnnee = async (req, res) => {
  try {
    const { idAnneeScolaire } = req.params;
    console.log(`🔍 [AcademicStructure] getAllCyclesByAnnee ID: ${idAnneeScolaire}`);

    const configurations = await EtablissementStructure.findAll({
      where: { idAnneeScolaire }
    });
    const idsEnseignement = configurations.map(c => c.idEnseignement);

    if (idsEnseignement.length === 0) {
      console.warn(`⚠️ [AcademicStructure] Aucun profil d'enseignement trouvé pour l'année ${idAnneeScolaire}`);
      return res.json([]);
    }

    const cycles = await Cycle.findAll({
      include: [{
        model: Enseignement,
        as: 'Enseignement',
        where: { idEnseignement: { [Op.in]: idsEnseignement }, supprimer: false }
      }],
      where: { supprimer: false }
    });

    const result = cycles.map(cycle => {
      const cycleJson = cycle.toJSON();
      return {
        ...cycleJson,
        idAnneeScolaire: parseInt(idAnneeScolaire),

        idServeur: cycleJson.idCycle,
        idEnseignementLocal: null,
        libelleCycleFr: cycleJson.libelleCycle,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("❌ [AcademicStructure] getAllCyclesByAnnee Error:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

exports.createClasse = async (req, res) => {
    try {
        const { libelleClasseFr, idCycle, abreviation } = req.body;
        const classe = await Classe.create({
            libelleClasseFr,
            idCycle,
            abreviation,
            ordre: 1
        });
        res.status(201).json(classe);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateClasse = async (req, res) => {
    try {
        const { id } = req.params;
        await Classe.update(req.body, { where: { idClasse: id } });
        res.json({ message: "Classe mise à jour" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteEnseignement = async (req, res) => {
  try {
    const { id } = req.params;
    await Enseignement.update({ supprimer: true }, { where: { idEnseignement: id } });
    return res.status(200).json({ message: "Enseignement marqué comme supprimé." });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteClasse = async (req, res) => {
    try {
        const { id } = req.params;
        await Classe.destroy({ where: { idClasse: id } });
        res.json({ message: "Classe supprimée avec succès" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};