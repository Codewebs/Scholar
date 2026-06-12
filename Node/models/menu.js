const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Menu = sequelize.define("Menu", {
  idMenu: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  libelleMenu: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: "menu",
  timestamps: false
});

module.exports = Menu;
