require('dotenv').config();

const express = require("express");
const app = express.Router();

// Import des sous-routes
const utilisateursRoutes = require("./users");
const qualitesRoutes = require("./qualites");
const menusRoutes = require("./menus");
const anneeRoutes = require("./annee");
const etablissementRoutes = require("./etablissement");
const students = require("./Students");
const salles = require("./salles");
const system = require("./system");
const config = require("./config");
const academicStructure = require("./academicStructure");
const personnel = require("./personnel");
const finance = require("./finance");
const matieres = require("./matieres");
const competences = require("./competences");
const periodes = require("./periodes");
const notes = require("./notes");
const repartitionEnseignant = require("./repartitionEnseignant");
const annonces = require("./annonces");
const reports = require("./reportRoutes");
const institutionalHeader = require("./institutionalHeader");
const trackingRoutes = require("./tracking");

// Import du modèle pour le keep-alive de la BD
const Qualite = require("../models/qualite");

// Montage des endpoints
app.use((req, res, next) => {
    console.log(`🛣️ [Router Index] Requête reçue: ${req.method} ${req.url}`);
    next();
});

// Endpoint de santé pour Uptimerobot (Public)
app.get("/health", (req, res) => {
    // 1. Réponse immédiate pour Render (Serveur)
    res.status(200).json({ status: "ok", message: "Server is awake" });

    // 2. Opération DB en arrière-plan pour Aiven (Base de données)
    // Non-bloquant pour la réponse health, mais maintient la connexion active
    // On ajoute un timestamp dans la description pour forcer une écriture réelle
    console.log("Check de Santé")
    Qualite.upsert({
        abreviation: "AGENT ",
        description: `Personnel (Actif: ${new Date().toISOString()})`,
        libelleQualite: "PERSONNEL",
        supprimer: 0
    }).catch(err => console.warn(`🛰️ [Health Check] DB Activity failed: ${err.message}`));
});

// Placer les routes spécifiques AVANT les routes génériques ou montées sur "/"
app.use("/annee", anneeRoutes);
app.use("/etablissement", etablissementRoutes);
app.use("/students", students);
app.use("/salles", salles);
app.use("/system", system);
app.use("/config", config);
app.use("/academic-structure", academicStructure);
app.use("/personnel", personnel);
app.use("/finance", finance);
app.use("/pedagogy/matieres", matieres);
app.use("/pedagogy/competences", competences);
app.use("/pedagogy/periodes", periodes);
app.use("/pedagogy/notes", notes);
app.use("/pedagogy/teachers-repartition", repartitionEnseignant);
app.use("/pedagogy/reports", reports);
app.use("/config/institutional-headers", institutionalHeader);
app.use("/annonces", annonces);
app.use("/tracking", trackingRoutes);

// Routes montées sur la racine
app.use("/qualites", qualitesRoutes);
app.use("/menus", menusRoutes);
app.use("/", utilisateursRoutes);

// Catch-all pour débugger
app.use((req, res) => {
    console.warn(`❓ [Router Index] Aucune route n'a matché: ${req.method} ${req.url}`);
    res.status(404).json({ error: "Route non trouvée" });
});

module.exports = app;