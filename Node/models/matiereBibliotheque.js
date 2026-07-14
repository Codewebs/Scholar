const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const MatiereBibliotheque = sequelize.define("MatiereBibliotheque", {
  idMatiereBibliotheque: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  libelleFr: { type: DataTypes.STRING(100), allowNull: false },
  libelleEn: { type: DataTypes.STRING(100), allowNull: true },
  abreviation: { type: DataTypes.STRING(15), allowNull: true },
  idEnseignement: { type: DataTypes.BIGINT, allowNull: false }, // Link to Academic Profile
  idCountry: { type: DataTypes.BIGINT, allowNull: false }
}, {
  tableName: "matiere_bibliotheque",
  timestamps: false
});

module.exports = MatiereBibliotheque;
