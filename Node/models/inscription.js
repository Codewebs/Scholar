const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Inscription = sequelize.define("Inscription", {
  idInscription: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  idEleve: { type: DataTypes.BIGINT, allowNull: false },
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: false },
  idSalle: { type: DataTypes.BIGINT, allowNull: false },
  dateInscription: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  statut: { type: DataTypes.STRING(20), defaultValue: "INSCRIT" }, // INSCRIT, DEMISSIONNAIRE, etc.
  ancienEtablissement: { type: DataTypes.STRING(255), allowNull: true },
  nouveau: { type: DataTypes.BOOLEAN, defaultValue: true },
  codeInscription: { type: DataTypes.STRING(20), allowNull: true },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "inscription",
  timestamps: true
});

module.exports = Inscription;
