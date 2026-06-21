const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Periode = sequelize.define("Periode", {
  idPeriode: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  libellePeriodeFr: { type: DataTypes.STRING(60), allowNull: false },
  libellePeriodeEn: { type: DataTypes.STRING(60), allowNull: true },
  libellePeriodeEs: { type: DataTypes.STRING(60), allowNull: true },
  abrevLibelleFr: { type: DataTypes.STRING(15), allowNull: false, defaultValue: '' },
  abrevLibelleEn: { type: DataTypes.STRING(15), allowNull: true },
  abrevLibelleEs: { type: DataTypes.STRING(15), allowNull: true },
  description: { type: DataTypes.STRING(255), allowNull: true },
  dateDebut: { type: DataTypes.STRING, allowNull: false },
  dateFin: { type: DataTypes.STRING, allowNull: false },
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: false },
  ordrePeriode: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "periode",
  timestamps: false
});

module.exports = Periode;
