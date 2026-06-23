const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const FraisExigible = sequelize.define("FraisExigible", {
  idFraisExigible: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
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
      fields: ['fraisFr'],
      name: 'unique_frais_fr'
    }
  ]
});

module.exports = FraisExigible;
