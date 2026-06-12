const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Annonce = sequelize.define("Annonce", {
  idAnnonce: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  titre: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contenu: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  type: {
    type: DataTypes.ENUM('COMMUNAUTAIRE', 'PUBLIQUE'),
    allowNull: false
  },
  idAuteur: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'utilisateur',
      key: 'idUtilisateur'
    }
  },
  idEtablissement: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'etablissement',
      key: 'idEtablissement'
    }
  }
}, {
  tableName: "annonce",
  timestamps: true
});

module.exports = Annonce;
