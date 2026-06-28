const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Qualite = require("./qualite");

const Utilisateur = sequelize.define("Utilisateur", {
  idUtilisateur: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  identifiant: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'unique_identifiant'
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'unique_email'
  },
  telephone: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  mdp: {
    type: DataTypes.STRING,
    allowNull: false
  },
  idQualite: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: "qualite",
      key: "idQualite"
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL"
  },
  fcmToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  photo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  diplomes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: "utilisateur",
  timestamps: false
});

Utilisateur.belongsTo(Qualite, {
  foreignKey: "idQualite",
  as: "qualite"
});

module.exports = Utilisateur;
