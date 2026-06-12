const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Quartier = sequelize.define("Quartier", {
  idQuartier: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  libelle: { type: DataTypes.STRING(100), allowNull: false },
  ville: { type: DataTypes.STRING(100), allowNull: true },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "quartier",
  timestamps: false
});

module.exports = Quartier;
