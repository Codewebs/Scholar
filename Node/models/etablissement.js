const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Etablissement = sequelize.define("Etablissement", {
  idEtablissement: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  nomFr: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nomEn: {
    type: DataTypes.STRING,
    allowNull: true
  },
  abreviation: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  deviseFr: {
    type: DataTypes.STRING,
    allowNull: true
  },
  deviseEn: {
    type: DataTypes.STRING,
    allowNull: true
  },
  devise: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  adresse: {
    type: DataTypes.STRING,
    allowNull: true
  },
  ville: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  pays: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  codeRecrutement: {
    type: DataTypes.STRING(10),
    defaultValue: "1234"
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true,
    validate: { isEmail: true }
  },
  telephone1: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  telephone2: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  telephone3: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  fax: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  siteWeb: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logo: {
    type: DataTypes.STRING, // Stocke le chemin ou l'URL
    allowNull: true
  },
  arrete: {
    type: DataTypes.STRING,
    allowNull: true
  },
  numBp: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  sise: {
    type: DataTypes.STRING,
    allowNull: true
  },
  supprimer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  idCreateur: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: "utilisateur",
      key: "idUtilisateur"
    }
  },
  pinSecurite: {
    type: DataTypes.STRING(4), // PIN à 4 chiffres
    allowNull: true
  }
}, {
  tableName: "etablissement",
  timestamps: true
});

module.exports = Etablissement;
