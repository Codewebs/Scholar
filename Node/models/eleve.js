const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Eleve = sequelize.define("Eleve", {
  idEleve: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  matricule: { type: DataTypes.STRING(20), allowNull: true },
  nom: { type: DataTypes.STRING(100), allowNull: false },
  prenom: { type: DataTypes.STRING(100), allowNull: true },
  dateNaissance: { type: DataTypes.DATEONLY, allowNull: false },
  lieuNaissance: { type: DataTypes.STRING(100), allowNull: false },
  sexe: { type: DataTypes.STRING(1), allowNull: false }, // 'M' or 'F'
  nomPere: { type: DataTypes.STRING(150), allowNull: true },
  telephonePere: { type: DataTypes.BIGINT, allowNull: true },
  nomMere: { type: DataTypes.STRING(150), allowNull: true },
  telephoneMere: { type: DataTypes.BIGINT, allowNull: true },
  nomTuteur: { type: DataTypes.STRING(150), allowNull: true },
  telephoneTuteur: { type: DataTypes.BIGINT, allowNull: true },
  quartier: { type: DataTypes.STRING(100), allowNull: true },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "eleve",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['matricule'],
      name: 'unique_matricule_eleve'
    }
  ]
});

module.exports = Eleve;
