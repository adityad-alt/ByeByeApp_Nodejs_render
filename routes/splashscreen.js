const express = require("express");
const sequelize = require("../db");

const router = express.Router();

function toISO(value) {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

// GET /splashscreen/date?status=ACTIVE|INACTIVE
// Returns the most recent splash_screen timestamps for the given status.
router.get("/date", async (req, res) => {
  try {
    const statusRaw = req.query?.status ?? "ACTIVE";
    const status = String(statusRaw).toUpperCase();
    if (!["ACTIVE", "INACTIVE"].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Use ACTIVE or INACTIVE.",
      });
    }

    const rows = await sequelize.query(
      `
        SELECT created_at, updated_at, splash_file
        FROM splash_screen
        WHERE STATUS = :status
        ORDER BY created_at DESC
        LIMIT 1
      `,
      {
        replacements: { status },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ message: "Splash screen row not found" });
    }

    const row = rows[0] || {};
    return res.status(200).json({
      message: "Splash screen date fetched successfully",
      data: {
        created_at: toISO(row.created_at),
        updated_at: toISO(row.updated_at),
        splash_file: row.splash_file ?? null,
        video_url: row.splash_file ?? null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch splash screen date",
      error: error?.message || String(error),
    });
  }
});

module.exports = router;

