const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Enseignement = sequelize.define("Enseignement", {
  idEnseignement: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  abreviation: { type: DataTypes.STRING(15), allowNull: true },
  description: { type: DataTypes.STRING(255), allowNull: true },
  enseignementFr: { type: DataTypes.STRING(60), allowNull: false },
  enseignementEn: { type: DataTypes.STRING(60), allowNull: true },
  enseignementEs: { type: DataTypes.STRING(60), allowNull: true },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false },
  idCountry: { type: DataTypes.BIGINT, allowNull: false }
}, {
  tableName: "enseignement",
  timestamps: false
});

module.exports = Enseignement;