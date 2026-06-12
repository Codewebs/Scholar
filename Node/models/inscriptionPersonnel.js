const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const InscriptionPersonnel = sequelize.define("InscriptionPersonnel", {
  idInscriptionPersonnel: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  matricule: { type: DataTypes.STRING(30), allowNull: false },
  nom: { type: DataTypes.STRING(120), allowNull: false },
  prenom: { type: DataTypes.STRING(120), allowNull: true },
  dateNaissance: { type: DataTypes.DATEONLY, allowNull: false },
  lieuNaissance: { type: DataTypes.STRING(120), allowNull: false },
  sexe: { type: DataTypes.STRING(10), allowNull: true },
  numCni: { type: DataTypes.STRING(50), allowNull: true },
  email: { type: DataTypes.STRING(120), allowNull: true },
  telephone1: { type: DataTypes.BIGINT, allowNull: false },
  telephone2: { type: DataTypes.BIGINT, allowNull: true },
  photo: { type: DataTypes.STRING(200), allowNull: true },
  statut: { type: DataTypes.BOOLEAN, defaultValue: true }, // Actif / Inactif
  bloque: { type: DataTypes.BOOLEAN, defaultValue: false }, // Bloqué par l'établissement
  role: { type: DataTypes.STRING(50), allowNull: false }, // Le rôle spécifique pour cette inscription (ex: ENSEIGNANT)
  idUtilisateur: { type: DataTypes.BIGINT, allowNull: false },
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: false },
  idEtablissement: { type: DataTypes.BIGINT, allowNull: false },
  idDemandeSource: { type: DataTypes.BIGINT, allowNull: true },
  permissionsAjoutees: { type: DataTypes.TEXT, allowNull: true }, // Liste JSON des permissions "bonus"
  permissionsRetirees: { type: DataTypes.TEXT, allowNull: true }, // Liste JSON des permissions révoquées
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "inscription_personnel",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['nom', 'prenom', 'idAnneeScolaire', 'idEtablissement'],
      name: 'unique_personnel_year'
    }
  ]
});

module.exports = InscriptionPersonnel;
