const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const FraisExigible = sequelize.define("FraisExigible", {
  idFraisExigible: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  fraisFr: { type: DataTypes.STRING(60), allowNull: false, unique: true },
  fraisEn: { type: DataTypes.STRING(60), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: true },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "frais_exigible",
  timestamps: false
});

module.exports = FraisExigible;
