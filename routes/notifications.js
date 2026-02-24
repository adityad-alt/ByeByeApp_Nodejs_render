const express = require("express");
const { Op } = require("sequelize");
const { AppNotification } = require("../models");
const { optionalAuth } = require("../middleware/auth");
const router = express.Router();

// POST /notifications — create notification (for admin panel; optionally protect with admin auth later)
router.post("/", optionalAuth, async (req, res) => {
  try {
    const { title, body, icon, user_id: userId } = req.body;
    if (!title || typeof title !== "string") {
      return res.status(400).json({ message: "title is required" });
    }
    const row = await AppNotification.create({
      title: String(title).trim(),
      body: body != null ? String(body) : null,
      icon: icon != null ? String(icon) : null,
      user_id: userId != null ? parseInt(userId, 10) : null,
      is_read: false
    });
    res.status(201).json({
      message: "Notification created",
      data: { id: row.id, title: row.title, body: row.body, icon: row.icon, created_at: row.created_at }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create notification",
      error: error.message
    });
  }
});

// GET /notifications — list notifications (optional auth; filter by user if token present)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id ?? null;
    const where = {};
    // If user is logged in, show broadcast (user_id null) + user-specific; else show only broadcast
    if (userId != null) {
      where[Op.or] = [{ user_id: null }, { user_id: userId }];
    } else {
      where.user_id = null;
    }

    const notifications = await AppNotification.findAll({
      attributes: ["id", "title", "body", "icon", "is_read", "user_id", "created_at"],
      where,
      order: [["created_at", "DESC"]],
      raw: true
    });

    res.status(200).json({
      message: "Notifications fetched successfully",
      data: notifications
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch notifications",
      error: error.message
    });
  }
});

// GET /notifications/check — lightweight check for new data (for polling). Returns latest id and count.
router.get("/check", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id ?? null;
    const afterId = req.query.after ? parseInt(req.query.after, 10) : null;

    const where = {};
    if (userId != null) {
      where[Op.or] = [{ user_id: null }, { user_id: userId }];
    } else {
      where.user_id = null;
    }

    const latest = await AppNotification.findOne({
      attributes: ["id", "created_at"],
      where,
      order: [["id", "DESC"]],
      raw: true
    });

    let newCount = 0;
    if (afterId != null && !isNaN(afterId) && latest) {
      const countWhere = { ...where, id: { [Op.gt]: afterId } };
      newCount = await AppNotification.count({ where: countWhere });
    }

    res.status(200).json({
      latestId: latest?.id ?? null,
      latestAt: latest?.created_at ?? null,
      newCount: newCount
    });
  } catch (error) {
    res.status(500).json({
      message: "Check failed",
      error: error.message
    });
  }
});

// PATCH /notifications/read-all — must be before /:id/read
router.patch("/read-all", optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.userId ?? req.user?.id ?? null;
    const where = userId != null
      ? { [Op.or]: [{ user_id: null }, { user_id: userId }] }
      : { user_id: null };
    await AppNotification.update({ is_read: true }, { where });
    res.status(200).json({ message: "All marked as read" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to mark all as read",
      error: error.message
    });
  }
});

// PATCH /notifications/:id/read — mark one as read
router.patch("/:id/read", optionalAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid notification id" });
    }
    const [updated] = await AppNotification.update(
      { is_read: true },
      { where: { id } }
    );
    if (updated === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(200).json({ message: "Marked as read", id });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update notification",
      error: error.message
    });
  }
});

module.exports = router;
