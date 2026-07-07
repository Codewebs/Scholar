const express = require("express");
const router = express.Router();
const { UserSession } = require("../models");
const { notifierTelegram } = require("../services/notificationService");
const { Op } = require("sequelize");

router.post("/track", async (req, res) => {
  try {
    const { user_uuid } = req.body;
    const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!user_uuid) {
      return res.status(400).json({ error: "user_uuid is required" });
    }

    // Chercher la dernière session pour cet utilisateur
    const lastSession = await UserSession.findOne({
      where: { user_uuid },
      order: [['last_seen', 'DESC']]
    });

    const now = new Date();

    if (!lastSession) {
      // Cas A: Première fois
      await UserSession.create({
        user_uuid,
        ip_address,
        first_seen: now,
        last_seen: now
      });
      await notifierTelegram(ip_address, user_uuid);
      return res.status(201).json({ message: "First session recorded" });
    }

    const diffInHours = (now - new Date(lastSession.last_seen)) / (1000 * 60 * 60);

    if (diffInHours >= 2) {
      // Cas B: Retour après plus de 2h
      await UserSession.create({
        user_uuid,
        ip_address,
        first_seen: now,
        last_seen: now
      });
      await notifierTelegram(ip_address, user_uuid);
      return res.status(201).json({ message: "New session recorded (after 2h+)" });
    } else {
      // Cas C: Navigation normale (< 2h)
      lastSession.last_seen = now;
      lastSession.ip_address = ip_address; // Update IP if changed
      await lastSession.save();
      return res.status(200).json({ message: "Activity updated" });
    }
  } catch (error) {
    console.error("❌ Tracking Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
