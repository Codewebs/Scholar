const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Cycle = sequelize.define("Cyclee", {
  idCycle: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  abreviation: { type: DataTypes.STRING(15), allowNull: true },
  description: { type: DataTypes.STRING(255), allowNull: true },
  libelleCycle: { type: DataTypes.STRING(60), allowNull: false },
  libelleCycleEn: { type: DataTypes.STRING(60), allowNull: true },
  libelleCycleEs: { type: DataTypes.STRING(60), allowNull: true },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false },
  idEnseignement: { type: DataTypes.BIGINT, allowNull: false },
  ordre: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }
}, {
  tableName: "cycle",
  timestamps: false
});

module.exports = Cycle;