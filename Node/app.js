const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const db = require("./db");
const routes = require("./routes");
const seedMenus = require("./middleware/menuSeeder");
const seedEducationProfiles = require("./middleware/educationProfilesSeeder");
const seedQualites = require("./middleware/qualiteSeeder");
const seedSpecialities = require("./middleware/specialitySeeder");

dotenv.config();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));

app.use((req, res, next) => {
  const token = req.headers.authorization ? "PRÉSENT" : "ABSENT";
  console.log(`📡 [${req.method}] ${req.url} - Auth: ${token}`);
  if (req.headers.authorization) {
      console.log(`🔑 Token: ${req.headers.authorization.substring(0, 30)}...`);
  }
  next();
});

// Routes
app.use("/", routes);

async function startApplication() {
  try {
    await db.initDatabase();
    await seedQualites();
    await seedMenus();
    await seedEducationProfiles();
    await seedSpecialities();
    console.log("✅ Base de données, qualités, menus, profils et spécialités initialisés.");
    
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Le serveur n'a pas pu démarrer :", error);
  }
}
	
startApplication();
