const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const EleveTransport = sequelize.define("EleveTransport", {
  idEleveTransport: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  idEleve: { type: DataTypes.BIGINT, allowNull: false },
  idTarifTransport: { type: DataTypes.BIGINT, allowNull: false },
  reduction: { type: DataTypes.INTEGER, defaultValue: 0 },
  statut: { type: DataTypes.STRING(50), defaultValue: 'ACTIF' }, // ACTIF, SUSPENDU, ANNULÉ
}, {
  tableName: "eleve_transport",
  timestamps: true
});

module.exports = EleveTransport;
