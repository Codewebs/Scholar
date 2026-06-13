const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const PaiementFraisPeriscolaire = sequelize.define("PaiementFraisPeriscolaire", {
  idPaiementFraisPeriscolaire: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  montantAlloue: { type: DataTypes.INTEGER, allowNull: false },
  idTarifFraisActivitePeriscolaire: { type: DataTypes.BIGINT, allowNull: false },
  idPaiementFraisGlobal: { type: DataTypes.BIGINT, allowNull: false },
  annule: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "paiement_frais_periscolaire",
  timestamps: true
});

module.exports = PaiementFraisPeriscolaire;
