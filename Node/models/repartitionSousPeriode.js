const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const RepartitionSousPeriode = sequelize.define("RepartitionSousPeriode", {
  idRepartitionSousPeriode: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  idClasse: { type: DataTypes.BIGINT, allowNull: false },
  idSousPeriode: { type: DataTypes.BIGINT, allowNull: false },
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: false },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "repartition_sous_periode",
  timestamps: false
});

module.exports = RepartitionSousPeriode;
