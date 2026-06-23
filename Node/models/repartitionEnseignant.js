const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const RepartitionEnseignant = sequelize.define("RepartitionEnseignant", {
  idRepartitionEnseignant: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  isPrincipal: { type: DataTypes.BOOLEAN, defaultValue: false },
  idAnneeScolaire: { type: DataTypes.BIGINT, allowNull: false },
  idInscriptionPersonnel: { type: DataTypes.BIGINT, allowNull: false },
  idRepartitionMatiere: { type: DataTypes.BIGINT, allowNull: true },
  idSalle: { type: DataTypes.BIGINT, allowNull: false },
  supprimer: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
  tableName: "repartition_enseignant",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['idSalle', 'idRepartitionMatiere', 'idAnneeScolaire'],
      name: 'unique_teacher_subject_room',
      where: { supprimer: false, idRepartitionMatiere: { [require('sequelize').Op.ne]: null } }
    }
  ]
});

module.exports = RepartitionEnseignant;
