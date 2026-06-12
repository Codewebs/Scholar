const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TarifFraisExigible = sequelize.define("TarifFraisExigible", {
  idTarifFraisExigible: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  montantFraisExigible: { type: DataTypes.INTEGER, allowNull: false },
  ordrePaiement: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  dateLimite: { type: DataTypes.DATEONLY, allowNull: false },
  dateAlerte: { type: DataTypes.DATEONLY, allowNull: false },
  idClasse: { type: DataTypes.BIGINT, allowNull: false },
  idFraisExigible: { type: DataTypes.BIGINT, allowNull: false },
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: false },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "tarif_frais_exigible",
  timestamps: true
});

module.exports = TarifFraisExigible;
