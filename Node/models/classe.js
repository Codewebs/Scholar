const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Classe = sequelize.define("Classe", {
  idClasse: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  abreviation: { type: DataTypes.STRING(15), allowNull: true },
  description: { type: DataTypes.STRING(255), allowNull: true },
  libelleClasseFr: { type: DataTypes.STRING(60), allowNull: false }, // Valeur Fr par défaut
  libelleClasseEn: { type: DataTypes.STRING(60), allowNull: true },
  libelleClasseEs: { type: DataTypes.STRING(60), allowNull: true },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false },
  idCycle: { type: DataTypes.BIGINT, allowNull: false },
  ordre: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
}, {
  tableName: "classe",
  timestamps: false
});

module.exports = Classe;