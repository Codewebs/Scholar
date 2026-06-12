const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Specialite = sequelize.define("Specialite", {
  idSpecialite: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  libelle: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('MATIERE', 'COMPETENCE_PRO'),
    allowNull: false
  }
}, {
  tableName: "specialite",
  timestamps: false
});

module.exports = Specialite;
