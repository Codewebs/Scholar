const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Country = sequelize.define("Country", {
  idCountry: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  nomPays: { type: DataTypes.STRING(100), allowNull: false },
  codePays: { type: DataTypes.STRING(5), allowNull: true }
}, {
  tableName: "country",
  timestamps: false
});

module.exports = Country;
