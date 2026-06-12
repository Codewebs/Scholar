const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AffectationPersonnelSalle = sequelize.define("AffectationPersonnelSalle", {
  idAffectation: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  idInscriptionPersonnel: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'inscription_personnel', key: 'idInscriptionPersonnel' }
  },
  idSalle: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'salle', key: 'idSalle' }
  },
  idMatiere: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: { model: 'matiere', key: 'idMatiere' }
  }
}, {
  tableName: "affectation_personnel_salle",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['idSalle', 'idMatiere'],
      name: 'unique_subject_per_room'
    }
  ]
});

module.exports = AffectationPersonnelSalle;
