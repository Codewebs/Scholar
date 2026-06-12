const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Competence = sequelize.define("Competence", {
  idCompetence: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  libelle: { type: DataTypes.STRING(255), allowNull: false },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "competence",
  timestamps: true
});

module.exports = Competence;
