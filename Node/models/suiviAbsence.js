const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const SuiviAbsence = sequelize.define("SuiviAbsence", {
  idSuiviAbsence: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  heuresAJ: { type: DataTypes.INTEGER, defaultValue: 0 }, // Absences Justifiées
  heuresANJ: { type: DataTypes.INTEGER, defaultValue: 0 }, // Absences Non Justifiées
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: false },
  idInscription: { type: DataTypes.BIGINT, allowNull: false },
  idSequence: { type: DataTypes.BIGINT, allowNull: true },
  idPeriode: { type: DataTypes.BIGINT, allowNull: true },
  verrouille: { type: DataTypes.BOOLEAN, defaultValue: false },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "suivi_absence",
  timestamps: false
});

module.exports = SuiviAbsence;
