const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const PaiementFraisExigible = sequelize.define("PaiementFraisExigible", {
  idPaiementFraisExigible: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  montantAlloue: { type: DataTypes.INTEGER, allowNull: false },
  idTarifFraisExigible: { type: DataTypes.BIGINT, allowNull: false }, // Correction: On lie au tarif (qui a le montant et la classe)
  idPaiementFraisGlobal: { type: DataTypes.BIGINT, allowNull: false }
}, {
  tableName: "paiement_frais_exigible",
  timestamps: false
});

module.exports = PaiementFraisExigible;
