const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const EnteteInstitutionnel = sequelize.define("EnteteInstitutionnel", {
  idEntete: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  idEtablissement: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  idEnseignement: {
    type: DataTypes.BIGINT,
    allowNull: true // Si null, c'est un en-tête par défaut
  },
  libelleEntete: {
    type: DataTypes.STRING(100),
    allowNull: false // ex: "En-tête Primaire Bilingue"
  },

  // Bloc Gauche (souvent Français ou Pays 1)
  blocGaucheLigne1: { type: DataTypes.STRING, allowNull: true }, // ex: REPUBLIQUE DU CAMEROUN
  blocGaucheLigne2: { type: DataTypes.STRING, allowNull: true }, // ex: Paix - Travail - Patrie
  blocGaucheLigne3: { type: DataTypes.STRING, allowNull: true }, // ex: MINISTERE DES ENSEIGNEMENTS SECONDAIRES
  blocGaucheLigne4: { type: DataTypes.STRING, allowNull: true }, // ex: DELEGATION REGIONALE...
  blocGaucheLigne5: { type: DataTypes.STRING, allowNull: true },
  blocGaucheLigne6: { type: DataTypes.STRING, allowNull: true },

  // Bloc Droit (souvent Anglais ou Pays 2)
  blocDroitLigne1: { type: DataTypes.STRING, allowNull: true },
  blocDroitLigne2: { type: DataTypes.STRING, allowNull: true },
  blocDroitLigne3: { type: DataTypes.STRING, allowNull: true },
  blocDroitLigne4: { type: DataTypes.STRING, allowNull: true },
  blocDroitLigne5: { type: DataTypes.STRING, allowNull: true },
  blocDroitLigne6: { type: DataTypes.STRING, allowNull: true },

  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  supprimer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: "entete_institutionnel",
  timestamps: true
});

module.exports = EnteteInstitutionnel;
