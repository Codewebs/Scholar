const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const RepartitionMatiere = sequelize.define("RepartitionMatiere", {
  idRepartitionMatiere: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  coef: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  noteSur: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 20 },
  ordreGroupe: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  ordreMatiere: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: false },
  idClasse: { type: DataTypes.BIGINT, allowNull: false },
  idGroupeMatiere: { type: DataTypes.BIGINT, allowNull: true },
  idMatiere: { type: DataTypes.BIGINT, allowNull: false },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "repartition_matiere",
  timestamps: true
});

module.exports = RepartitionMatiere;
