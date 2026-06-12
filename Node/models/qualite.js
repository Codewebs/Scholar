const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Qualite = sequelize.define("Qualite", {
  idQualite: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  abreviation: {
    type: DataTypes.STRING(15)
  },
  description: {
    type: DataTypes.STRING(255)
  },
  libelleQualite: {
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true
  },
  supprimer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: "qualite",
  timestamps: false
});

module.exports = Qualite;
