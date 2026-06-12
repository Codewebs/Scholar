const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const UtilisateurSpecialite = sequelize.define("UtilisateurSpecialite", {
  idUtilisateur: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    references: {
      model: 'utilisateur',
      key: 'idUtilisateur'
    }
  },
  idSpecialite: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    references: {
      model: 'specialite',
      key: 'idSpecialite'
    }
  }
}, {
  tableName: "utilisateur_specialite",
  timestamps: false
});

module.exports = UtilisateurSpecialite;
