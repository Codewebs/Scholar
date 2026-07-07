const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const UserSession = sequelize.define("user_sessions", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_uuid: {
    type: DataTypes.STRING(36),
    allowNull: false,
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: false,
  },
  first_seen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  last_seen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
});

module.exports = UserSession;
