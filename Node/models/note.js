const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Note = sequelize.define("Note", {
  idNote: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  note: { type: DataTypes.DOUBLE, allowNull: true },
  cote: { type: DataTypes.STRING(5), allowNull: true },
  appreciation: { type: DataTypes.STRING(100), allowNull: true },
  pasNote: { type: DataTypes.BOOLEAN, defaultValue: false },
  nonClasse: { type: DataTypes.BOOLEAN, defaultValue: false },
  valeurSaisie: { type: DataTypes.DOUBLE, allowNull: true },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false },
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: true },
  idInscription: { type: DataTypes.BIGINT, allowNull: true },
  idJustification: { type: DataTypes.BIGINT, allowNull: true },
  idSequence: { type: DataTypes.BIGINT, allowNull: true },
  idRepartitionCompetence: { type: DataTypes.BIGINT, allowNull: true }
}, {
  tableName: "note",
  timestamps: true,
  indexes: [
    {
      name: 'idx_unique_note_entry',
      unique: true,
      fields: ['idInscription', 'idSequence', 'idAnneeScolaire', 'idRepartitionCompetence'],
      where: { supprimer: false }
    }
  ]
});

module.exports = Note;
