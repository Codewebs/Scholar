const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const GroupeMatiere = sequelize.define("GroupeMatiere", {
  idGroupeMatiere: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  libelleFr: { type: DataTypes.STRING(60), allowNull: false },
  libelleEn: { type: DataTypes.STRING(60), allowNull: true },
  libelleEs: { type: DataTypes.STRING(60), allowNull: true },
  ordre: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  idEtablissement: { type: DataTypes.BIGINT, allowNull: true }, // Added for scoping groups by school
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "groupe_matiere",
  timestamps: false
});

module.exports = GroupeMatiere;
