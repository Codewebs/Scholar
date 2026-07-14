const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const EtablissementStructure = sequelize.define("EtablissementStructure", {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  idEtablissement: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  idAnneeScolaire: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  idCountry: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  idEnseignement: {
    type: DataTypes.BIGINT,
    allowNull: true
  }
}, {
  tableName: "etablissement_structure",
  timestamps: false
});

module.exports = EtablissementStructure;
