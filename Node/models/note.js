const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Note = sequelize.define("Note", {
  idNote: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  note: { type: DataTypes.DOUBLE, allowNull: true }, // Allow null for non-graded yet
  cote: { type: DataTypes.STRING(5), allowNull: true }, // A+, B, etc.
  appreciation: { type: DataTypes.STRING(100), allowNull: true }, // CTBA, CBA, etc.
  pasNote: { type: DataTypes.BOOLEAN, defaultValue: false },
  nonClasse: { type: DataTypes.BOOLEAN, defaultValue: false }, // AJ, ANJ
  valeurSaisie: { type: DataTypes.DOUBLE, allowNull: true }, // "m" in the table
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false },
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: true },
  idInscription: { type: DataTypes.BIGINT, allowNull: true }, // Student enrollment
  idJustification: { type: DataTypes.BIGINT, allowNull: true },
  idRepartitionMatiere: { type: DataTypes.BIGINT, allowNull: true },
  idSequence: { type: DataTypes.BIGINT, allowNull: true } // Sequence (e.g., Sequence 1, 2...)
}, {
  tableName: "note",
  timestamps: true,
  indexes: [
    {
      name: 'idx_unique_note_entry',
      unique: true,
      fields: ['idInscription', 'idRepartitionMatiere', 'idSequence', 'idAnneeScolaire'],
      where: { supprimer: false }
    }
  ]
});

module.exports = Note;
