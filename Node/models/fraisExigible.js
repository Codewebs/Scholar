const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const FraisExigible = sequelize.define("FraisExigible", {
  idFraisExigible: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  idEtablissement: { type: DataTypes.BIGINT, allowNull: true }, // Scoped to school
  fraisFr: { type: DataTypes.STRING(60), allowNull: false },
  fraisEn: { type: DataTypes.STRING(60), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: true },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "frais_exigible",
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['fraisFr', 'idEtablissement'],
      name: 'unique_frais_etab'
    }
  ]
});

module.exports = FraisExigible;
