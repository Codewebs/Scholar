const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Salle = sequelize.define("Salle", {
  idSalle: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  nomSalle: { type: DataTypes.STRING(100), allowNull: false },
  capacite: { type: DataTypes.INTEGER, allowNull: true },
  photo: { type: DataTypes.TEXT, allowNull: true }, // URL ou Base64
  idClasse: { type: DataTypes.BIGINT, allowNull: false },
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: true },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "salle",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['nomSalle', 'idClasse', 'idAnneeScolaire'],
      name: 'unique_room_name_per_class_per_year'
    }
  ]
});

module.exports = Salle;
