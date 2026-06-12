// models/Section.js
const { DataTypes } = require("sequelize");
const sequelize = require("./db");

const Section = sequelize.define("Section", {
  title: { type: DataTypes.STRING },
  content: { type: DataTypes.TEXT },
});

module.exports = Section;
