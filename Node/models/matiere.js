const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Matiere = sequelize.define("Matiere", {
  idMatiere: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  idEtablissement: { type: DataTypes.BIGINT, allowNull: true },
  libelleFr: { type: DataTypes.STRING(100), allowNull: false },
  libelleEn: { type: DataTypes.STRING(100), allowNull: true },
  libelleEs: { type: DataTypes.STRING(100), allowNull: true },
  abreviation: { type: DataTypes.STRING(15), allowNull: true },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "matiere",
  timestamps: false
});

module.exports = Matiere;
