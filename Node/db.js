const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || "scholar_db",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
    define: {
      freezeTableName: true,
      timestamps: false,
    },
    dialectOptions: {
      charset: 'utf8mb4',
    },
  }
);

const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connexion à la base de données réussie.");

    // Charger tous les modèles et associations
    require("./models");

    // Une fois la structure stable, évitez { alter: true } en production
    await sequelize.sync();
    console.log("✅ Modèles synchronisés avec succès.");
  } catch (error) {
    console.error("❌ Erreur d'initialisation de la base de données :", error);
    process.exit(1);
  }
};

sequelize.initDatabase = initDatabase;

module.exports = sequelize;