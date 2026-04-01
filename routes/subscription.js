const express = require("express");
const { QueryTypes } = require("sequelize");
const sequelize = require("../db");

const router = express.Router();

// GET /subscriptions — list subscriptions (optional ?type=Seafarer)
router.get("/", async (req, res) => {
  try {
    const type = req.query?.type ? String(req.query.type).trim() : "";
    const hasTypeFilter = type.length > 0;

    const data = await sequelize.query(
      `
        SELECT
          id,
          subscription_type,
          amount,
          currency,
          created_at,
          updated_at
        FROM subscriptions
        ${hasTypeFilter ? "WHERE subscription_type LIKE :type" : ""}
        ORDER BY id ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements: hasTypeFilter ? { type: `%${type}%` } : undefined,
      }
    );

    return res.status(200).json({
      message: "Subscriptions fetched successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to get subscriptions",
      error: error.message,
    });
  }
});

module.exports = router;
