// models/AutorisationUtilisateur.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Utilisateur = require("./Utilisateur");
const Menu = require("./Menu");
const AnneeScolaire = require("./AnneeScolaire");

const AutorisationUtilisateur = sequelize.define("AutorisationUtilisateur", {
  idAutorisation: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  idAnneeScolaire: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: "annee_scolaire",
      key: "idAnneeScolaire"
    }
  }
}, {
  tableName: "autorisation_utilisateur",
  timestamps: false
});

// Définir les relations
// Relations
Utilisateur.hasMany(AutorisationUtilisateur, { foreignKey: "idUtilisateur" });
Menu.hasMany(AutorisationUtilisateur, { foreignKey: "idMenu" });
AnneeScolaire.hasMany(AutorisationUtilisateur, { foreignKey: "idAnneeScolaire" });

AutorisationUtilisateur.belongsTo(Utilisateur, { foreignKey: "idUtilisateur" });
AutorisationUtilisateur.belongsTo(Menu, { foreignKey: "idMenu" });
AutorisationUtilisateur.belongsTo(AnneeScolaire, { foreignKey: "idAnneeScolaire" });


module.exports = AutorisationUtilisateur;

