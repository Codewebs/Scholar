const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const CompetenceEnseignant = sequelize.define("CompetenceEnseignant", {
  idInscriptionPersonnel: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    references: { model: 'inscription_personnel', key: 'idInscriptionPersonnel' }
  },
  idMatiere: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    references: { model: 'matiere', key: 'idMatiere' }
  }
}, {
  tableName: "competence_enseignant",
  timestamps: false
});

module.exports = CompetenceEnseignant;
