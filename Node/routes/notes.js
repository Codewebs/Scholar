const express = require("express");
const router = express.Router();
const controller = require("../middleware/noteController");
const { verifyToken } = require("../middleware/auth");
const checkPermission = require("../middleware/checkPermission");

// Saisie des notes
router.get("/matiere", verifyToken, controller.getNotesByMatiere);
router.post("/save", verifyToken, checkPermission("MANAGE_GRADES"), controller.saveNotes);
router.post("/bulk-action", verifyToken, checkPermission("MANAGE_GRADES"), controller.bulkActionNotes);

// Saisie par élève
router.get("/student", verifyToken, controller.getNotesByStudent);
router.post("/student/save", verifyToken, checkPermission("MANAGE_GRADES"), controller.saveNotesByStudent);

// Suivi absences
router.get("/absences", verifyToken, controller.getAbsencesBySalle);
router.get("/absences/student", verifyToken, controller.getAbsencesByStudent);
router.post("/absences/save", verifyToken, checkPermission("MANAGE_ABSENCES"), controller.saveAbsences);
router.post("/absences/student/save", verifyToken, checkPermission("MANAGE_ABSENCES"), controller.saveAbsenceEntry);

// PV et Rapports
router.get("/summary", verifyToken, controller.getStudentSummary);
router.get("/pv", verifyToken, controller.getPVData);
router.get("/bulletins/export", verifyToken, controller.exportBulletins);

// Justifications
router.get("/justifications", verifyToken, controller.getJustifications);
router.post("/justifications", verifyToken, checkPermission("MANAGE_JUSTIFICATIONS"), controller.createJustification);
router.put("/justifications/:id", verifyToken, checkPermission("MANAGE_JUSTIFICATIONS"), controller.updateJustification);
router.delete("/justifications/:id", verifyToken, checkPermission("MANAGE_JUSTIFICATIONS"), controller.deleteJustification);

// CRUD Individuel
router.get("/:id", verifyToken, controller.getNote);
router.put("/:id", verifyToken, checkPermission("MANAGE_GRADES"), controller.updateNote);
router.delete("/:id", verifyToken, checkPermission("MANAGE_GRADES"), controller.deleteNote);

module.exports = router;
