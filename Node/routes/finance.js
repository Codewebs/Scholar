const express = require("express");
const router = express.Router();
const controller = require("../middleware/financeController");
const { verifyToken } = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

// 🛡️ Route de vérification (Utilisation d'un chemin unique pour éviter tout conflit)
router.get("/check-tarif-payments/:idTarif", verifyToken, controller.checkTarifPayments);

// Bibliothèque globale
router.get("/exigibles/library", verifyToken, controller.getFraisExigiblesLibrary);
router.post("/exigibles/library", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.createFraisExigible);
router.put("/exigibles/library/:id", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.updateFraisExigible);
router.delete("/exigibles/library/:id", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.deleteFraisExigible);

// Frais Périscolaires
router.get("/periscolaires/library", verifyToken, controller.getFraisPeriscolairesLibrary);
router.post("/periscolaires/library", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.createFraisPeriscolaire);
router.put("/periscolaires/library/:id", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.updateFraisPeriscolaire);
router.delete("/periscolaires/library/:id", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.deleteFraisPeriscolaire);

// Tarification par classe
router.get("/tarifs/classe/:idClasse/:idAnneeScolaire", verifyToken, controller.getTarifsByClasse);
router.get("/tarifs/all/:idAnneeScolaire", verifyToken, controller.getAllTarifsOfYear);
router.post("/tarifs/save", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.saveTarifs);

// Statistiques de recouvrement
router.get("/stats/recouvrement/:idClasse/:idAnneeScolaire", verifyToken, checkPermission("VIEW_FINANCIAL_REPORTS"), controller.getRecouvrementStats);

// Paiements
router.post("/paiements/exigibles", verifyToken, checkPermission("COLLECT_TUITION_FEE"), controller.payerFraisExigibles);
router.post("/paiements/periscolaires", verifyToken, checkPermission("COLLECT_OTHER_FEES"), controller.payerFraisPeriscolaires);
router.get("/paiements/details/:idEleve/:idAnneeScolaire", verifyToken, controller.getStudentPaymentDetails);
router.get("/paiements/transactions/:idEleve/:idAnneeScolaire", verifyToken, controller.getStudentTransactions);
router.get("/paiements/periscolaires/details/:idEleve/:idAnneeScolaire", verifyToken, controller.getStudentPeriscolaireDetails);
router.get("/receipt/registration/:idEleve/:idAnneeScolaire", verifyToken, controller.getRegistrationReceiptData);
router.get("/receipt/registration-simple/:idEleve/:idAnneeScolaire", verifyToken, controller.getSimpleRegistrationReceipt);
router.post("/paiements/annuler/:idPaiementFraisGlobal", verifyToken, checkPermission("CANCEL_PAYMENT"), controller.annulerPaiement);
router.post("/tarifs/periscolaires/bulk", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.bulkAssignPeriscolaire);

router.get("/reports/cockpit/aggregates/:idAnneeScolaire", verifyToken, controller.getCockpitAggregates);

// Multi-classe application
router.get("/classes/missing-frais/:idFrais/:idAnneeScolaire", verifyToken, controller.getClassesMissingFrais);
router.post("/tarifs/bulk-apply", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.bulkApplyTarif);

// Reports & Analytics
router.get("/reports/bilan/journalier/:idAnneeScolaire", verifyToken, controller.getBilanJournalier);
router.get("/reports/bilan/mensuel/:idAnneeScolaire", verifyToken, controller.getBilanMensuel);
router.get("/reports/bilan/annuel/:idAnneeScolaire", verifyToken, controller.getBilanAnnuel);
router.get("/reports/comparaison/performance/:idAnneeScolaire", verifyToken, controller.getPerformanceComparison);
router.get("/reports/listes/insolvables/:idAnneeScolaire/:idTranche", verifyToken, controller.getInsolvablesList);

// Transport
router.get("/transport/quartiers", verifyToken, controller.getQuartiers);
router.post("/transport/quartiers", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.createQuartier);
router.get("/transport/tarifs/:idAnneeScolaire", verifyToken, controller.getTarifsTransport);
router.post("/transport/tarifs", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.saveTarifTransport);
router.post("/transport/subscribe", verifyToken, checkPermission("MANAGE_ACADEMIC_CONFIG"), controller.subscribeStudentToTransport);
router.get("/transport/subscription/:idEleve/:idAnneeScolaire", verifyToken, controller.getStudentTransportSubscription);
router.post("/paiements/transport", verifyToken, checkPermission("COLLECT_OTHER_FEES"), controller.payerTransport);

module.exports = router;
