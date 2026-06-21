const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const PaiementTransport = sequelize.define("PaiementTransport", {
  idPaiementTransport: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  montantVerse: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  idPaiementFraisGlobal: { type: DataTypes.BIGINT, allowNull: false },
  idEcheancier: { type: DataTypes.BIGINT, allowNull: true },
  idEleveTransport: { type: DataTypes.BIGINT, allowNull: true },
  annule: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "paiement_transport",
  timestamps: true
});

module.exports = PaiementTransport;
