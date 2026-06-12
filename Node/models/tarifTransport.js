const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TarifTransport = sequelize.define("TarifTransport", {
  idTarifTransport: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  montantTransport: { type: DataTypes.INTEGER, allowNull: false },
  idQuartier: { type: DataTypes.BIGINT, allowNull: false },
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: false },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "tarif_transport",
  timestamps: true
});

module.exports = TarifTransport;
