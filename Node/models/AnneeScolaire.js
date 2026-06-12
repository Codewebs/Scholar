const { DataTypes } = require('sequelize');
const sequelize = require('../db'); 

const AnneeScolaire = sequelize.define('AnneeScolaire', {
  idAnneeScolaire: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  libelleAnneeScolaire: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateDebut: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateFin: {
    type: DataTypes.STRING,
    allowNull: false
  },
  cloturerAnnee: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  idEtablissement: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'etablissement',
      key: 'idEtablissement'
    }
  }
}, {
  tableName: 'annee_scolaire'
});

module.exports = AnneeScolaire;
