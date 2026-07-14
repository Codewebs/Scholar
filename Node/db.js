const { Sequelize } = require("sequelize");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

// Chargement facultatif du fichier .env (utile uniquement en local)
const envPath = path.join(__dirname, "..", "web", ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log("✅ [DB] .env local chargé depuis ../web/.env");
} else {
  // On tente le .env à la racine de Node si l'autre est absent
  dotenv.config();
}

console.log("📊 [DB Debug] Configuration cible :");
console.log("   - HOST :", process.env.DB_HOST || "localhost (DEFAULT)");
console.log("   - PORT :", process.env.DB_PORT || "3306 (DEFAULT)");
console.log("   - DB   :", process.env.DB_NAME || "scholar_db (DEFAULT)");
console.log("   - USER :", process.env.DB_USER || "root (DEFAULT)");
console.log("   - SSL  :", process.env.DB_SSL || "DISABLED");

const sequelize = new Sequelize(
  process.env.DB_NAME || "scholar_db",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 3306,
    dialect: "mysql",
    logging: false,
    define: {
      freezeTableName: true,
      timestamps: false,
    },
    dialectOptions: {
      charset: 'utf8mb4',
      ssl: (process.env.DB_SSL === 'REQUIRED' || process.env.DB_SSL === 'true') ? {
        rejectUnauthorized: false
      } : false
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
    await sequelize.sync({ alter: true });
    console.log("✅ Modèles synchronisés avec succès (Alter: true).");
  } catch (error) {
    console.error("❌ Erreur d'initialisation de la base de données :", error);
    process.exit(1);
  }
};

sequelize.initDatabase = initDatabase;

module.exports = sequelize;