const { Sequelize } = require("sequelize");
const path = require("path");
const dotenv = require("dotenv");

const envPath = path.join(__dirname, "..", "web", ".env");
const result = dotenv.config({ path: envPath });

console.log("🔍 [DB Debug] Chemin .env :", envPath);
if (result.error) {
  console.error("❌ [DB Debug] Erreur chargement .env :", result.error.message);
} else {
  console.log("✅ [DB Debug] .env chargé avec succès.");
}

console.log("📊 [DB Debug] Configuration cible :");
console.log("   - HOST :", process.env.DB_HOST || "localhost (DEFAULT)");
console.log("   - DB   :", process.env.DB_NAME || "scholar_db (DEFAULT)");
console.log("   - USER :", process.env.DB_USER || "root (DEFAULT)");

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
  console.log(`📡 Tentative de connexion à la base de données sur ${process.env.DB_HOST || "localhost"}...`);

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