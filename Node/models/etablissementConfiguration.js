const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const EtablissementConfiguration = sequelize.define("EtablissementConfiguration", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  idEtablissement: { type: DataTypes.BIGINT, allowNull: false },
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: false },
  dateDebut: { type: DataTypes.DATEONLY, allowNull: true },
  dateFin: { type: DataTypes.DATEONLY, allowNull: true },
  active: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "etablissement_configuration",
  timestamps: true
});

module.exports = EtablissementConfiguration;
