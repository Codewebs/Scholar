const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Justification = sequelize.define("Justification", {
  idJustification: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  description: { type: DataTypes.STRING(255), allowNull: true },
  libelleJustificationFr: { type: DataTypes.STRING(60), allowNull: false },
  libelleJustificationEn: { type: DataTypes.STRING(60), allowNull: true },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "justification",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['libelleJustificationFr'],
      name: 'unique_libelle_justification_fr'
    }
  ]
});

module.exports = Justification;
