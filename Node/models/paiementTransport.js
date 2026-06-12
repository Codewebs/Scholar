const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const PaiementTransport = sequelize.define("PaiementTransport", {
  idPaiementTransport: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  dateDebut: { type: DataTypes.DATEONLY, allowNull: false },
  dateFin: { type: DataTypes.DATEONLY, allowNull: false },
  idMois: { type: DataTypes.INTEGER, allowNull: true }, // 1-12
  idPaiementFraisGlobal: { type: DataTypes.BIGINT, allowNull: false },
  idTarifTransport: { type: DataTypes.BIGINT, allowNull: false }
}, {
  tableName: "paiement_transport",
  timestamps: true
});

module.exports = PaiementTransport;
