const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const SousPeriode = sequelize.define("SousPeriode", {
  idSousPeriode: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  libelleSousPeriodeFr: { type: DataTypes.STRING(60), allowNull: false },
  libelleSousPeriodeEn: { type: DataTypes.STRING(60), allowNull: true },
  libelleSousPeriodeEs: { type: DataTypes.STRING(60), allowNull: true },
  abrevLibelleFr: { type: DataTypes.STRING(15), allowNull: false, defaultValue: '' },
  abrevLibelleEn: { type: DataTypes.STRING(15), allowNull: true },
  abrevLibelleEs: { type: DataTypes.STRING(15), allowNull: true },
  dateDebut: { type: DataTypes.STRING, allowNull: false },
  dateFin: { type: DataTypes.STRING, allowNull: false },
  idPeriode: { type: DataTypes.BIGINT, allowNull: false },
  ordreSousPeriode: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "sous_periode",
  timestamps: false
});

module.exports = SousPeriode;
