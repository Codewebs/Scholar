const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const PaiementFraisGlobal = sequelize.define("PaiementFraisGlobal", {
  idPaiementFraisGlobal: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  montantTotal: { type: DataTypes.INTEGER, allowNull: false },
  datePaiement: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  modePaiement: { type: DataTypes.STRING(50), defaultValue: "CASH" },
  referenceTransaction: { type: DataTypes.STRING(100), allowNull: true },
  idEleve: { type: DataTypes.BIGINT, allowNull: false },
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: false },
  idCaissier: { type: DataTypes.BIGINT, allowNull: true }, // Utilisateur qui a encaissé
  annule: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "paiement_frais_global",
  timestamps: true
});

module.exports = PaiementFraisGlobal;
