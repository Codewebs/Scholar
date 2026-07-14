const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const FraisActivitePeriscolaire = sequelize.define("FraisActivitePeriscolaire", {
  idFraisActivitePeriscolaire: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  idEtablissement: { type: DataTypes.BIGINT, allowNull: true },
  libelleFr: { type: DataTypes.STRING(100), allowNull: false },
  libelleEn: { type: DataTypes.STRING(100), allowNull: true },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "frais_activite_periscolaire",
  timestamps: false
});

module.exports = FraisActivitePeriscolaire;
