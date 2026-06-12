const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const RepartitionCompetence = sequelize.define("RepartitionCompetence", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  idRepartitionMatiere: { type: DataTypes.BIGINT, allowNull: false },
  idCompetence: { type: DataTypes.BIGINT, allowNull: false },
  idSousPeriode: { type: DataTypes.BIGINT, allowNull: false },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "repartition_competence_sous_periode",
  timestamps: true
});

module.exports = RepartitionCompetence;
