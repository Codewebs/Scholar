const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const EcheancierTransport = sequelize.define("EcheancierTransport", {
  idEcheancier: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  idEleveTransport: { type: DataTypes.BIGINT, allowNull: false },
  libelle: { type: DataTypes.STRING(100), allowNull: false }, // Ex: "Octobre", "Tranche 1"
  montantDu: { type: DataTypes.INTEGER, allowNull: false },
  montantPaye: { type: DataTypes.INTEGER, defaultValue: 0 },
  dateLimite: { type: DataTypes.DATEONLY, allowNull: true },
}, {
  tableName: "echeancier_transport",
  timestamps: true
});

module.exports = EcheancierTransport;
