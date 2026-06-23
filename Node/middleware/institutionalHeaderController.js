const { EnteteInstitutionnel, Enseignement, EtablissementStructure } = require("../models");

exports.getAllHeaders = async (req, res) => {
  try {
    const { idEtablissement } = req.params;
    const headers = await EnteteInstitutionnel.findAll({
      where: { idEtablissement, supprimer: false },
      include: [{ model: Enseignement, as: 'Enseignement', attributes: ['enseignementFr', 'enseignementEn'] }]
    });
    res.json(headers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveHeader = async (req, res) => {
  try {
    const { idEntete, idEtablissement, ...data } = req.body;

    if (data.isDefault) {
      await EnteteInstitutionnel.update({ isDefault: false }, { where: { idEtablissement } });
    }

    let header;
    if (idEntete) {
      await EnteteInstitutionnel.update(data, { where: { idEntete } });
      header = await EnteteInstitutionnel.findByPk(idEntete);
    } else {
      header = await EnteteInstitutionnel.create({ ...data, idEtablissement });
    }

    res.json(header);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteHeader = async (req, res) => {
  try {
    const { id } = req.params;
    await EnteteInstitutionnel.update({ supprimer: true }, { where: { idEntete: id } });
    res.json({ message: "En-tête supprimé" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getHeaderForSalle = async (req, res) => {
  try {
    const { idSalle, idAnneeScolaire, idEtablissement } = req.query;

    // 1. Trouver l'enseignement de la salle via sa classe
    const salle = await require("../models").Salle.findByPk(idSalle, {
      include: [{
        model: require("../models").Classe,
        as: 'Classe',
        include: [{
          model: require("../models").Cycle,
          as: 'Cycle',
          attributes: ['idEnseignement']
        }]
      }]
    });

    const idEnseignement = salle?.Classe?.Cycle?.idEnseignement;

    // 2. Chercher un en-tête spécifique à cet enseignement
    if (idEnseignement) {
      const specificHeader = await EnteteInstitutionnel.findOne({
        where: { idEtablissement, idEnseignement, supprimer: false }
      });
      if (specificHeader) return res.json(specificHeader);
    }

    // 3. Sinon, chercher l'en-tête par défaut
    const defaultHeader = await EnteteInstitutionnel.findOne({
      where: { idEtablissement, isDefault: true, supprimer: false }
    });
    if (defaultHeader) return res.json(defaultHeader);

    // 4. Si rien, retourner null (le front utilisera ses valeurs par défaut codées en dur)
    res.json(null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
