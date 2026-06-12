const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TarifFraisPeriscolaire = sequelize.define("TarifFraisPeriscolaire", {
  idTarifFraisActivitePeriscolaire: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  montantFraisActivitePeriscolaire: { type: DataTypes.INTEGER, allowNull: false },
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: false },
  idFraisActivitePeriscolaire: { type: DataTypes.BIGINT, allowNull: false },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "tarif_frais_periscolaire",
  timestamps: true
});

module.exports = TarifFraisPeriscolaire;
