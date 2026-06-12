const express = require("express");
const router = express.Router();
const controller = require("../middleware/financeController");
const { verifyToken } = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

// Bibliothèque globale
router.get("/exigibles/library", verifyToken, controller.getFraisExigiblesLibrary);
router.post("/exigibles/library", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.createFraisExigible);
router.put("/exigibles/library/:id", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.updateFraisExigible);
router.delete("/exigibles/library/:id", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.deleteFraisExigible);

// Tarification par classe
router.get("/tarifs/classe/:idClasse/:idAnneeScolaire", verifyToken, controller.getTarifsByClasse);
router.post("/tarifs/save", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.saveTarifs);

// Statistiques de recouvrement
router.get("/stats/recouvrement/:idClasse/:idAnneeScolaire", verifyToken, checkPermission("VIEW_FINANCIAL_REPORTS"), controller.getRecouvrementStats);

// Paiements
router.post("/paiements/exigibles", verifyToken, checkPermission("COLLECT_TUITION_FEE"), controller.payerFraisExigibles);
router.get("/paiements/details/:idEleve/:idAnneeScolaire", verifyToken, controller.getStudentPaymentDetails);
router.get("/receipt/registration/:idEleve/:idAnneeScolaire", verifyToken, controller.getRegistrationReceiptData);

// Multi-classe application
router.get("/classes/missing-frais/:idFrais/:idAnneeScolaire", verifyToken, controller.getClassesMissingFrais);
router.post("/tarifs/bulk-apply", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.bulkApplyTarif);

// Reports & Analytics
router.get("/reports/bilan/journalier/:idAnneeScolaire", verifyToken, controller.getBilanJournalier);
router.get("/reports/bilan/mensuel/:idAnneeScolaire", verifyToken, controller.getBilanMensuel);
router.get("/reports/bilan/annuel/:idAnneeScolaire", verifyToken, controller.getBilanAnnuel);
router.get("/reports/comparaison/performance/:idAnneeScolaire", verifyToken, controller.getPerformanceComparison);
router.get("/reports/listes/insolvables/:idAnneeScolaire/:idTranche", verifyToken, controller.getInsolvablesList);

module.exports = router;
