const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const DemandeInscriptionPersonnel = sequelize.define("DemandeInscriptionPersonnel", {
  idDemande: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  idUtilisateur: { type: DataTypes.BIGINT, allowNull: false },
  idEtablissement: { type: DataTypes.BIGINT, allowNull: false },
  profilDemande: { type: DataTypes.STRING(50), allowNull: false }, // ex: 'ENSEIGNANT', 'DIRECTEUR'
  nom: { type: DataTypes.STRING(120), allowNull: false },
  prenom: { type: DataTypes.STRING(120), allowNull: false },
  telephone1: { type: DataTypes.BIGINT, allowNull: false },
  email: { type: DataTypes.STRING(120), allowNull: true },
  dateDemande: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  etat: {
    type: DataTypes.ENUM('EN_ATTENTE', 'VALIDE', 'REJETE'),
    defaultValue: 'EN_ATTENTE'
  },
  motifRejet: { type: DataTypes.STRING(255), allowNull: true },
  specialites: { type: DataTypes.TEXT, allowNull: true }, // JSON string or comma separated IDs for teachers
  idEleveLinked: { type: DataTypes.BIGINT, allowNull: true }
}, {
  tableName: "demande_inscription_personnel",
  timestamps: true
});

module.exports = DemandeInscriptionPersonnel;
