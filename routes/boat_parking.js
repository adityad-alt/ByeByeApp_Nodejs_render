const express = require("express");
const { BoatParking } = require("../models");
const router = express.Router();

// Get boat parking place list (optional query: status=ACTIVE|INACTIVE|DRAFT)
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && ["ACTIVE", "INACTIVE", "DRAFT"].includes(String(status).toUpperCase())) {
      where.STATUS = String(status).toUpperCase();
    }

    const list = await BoatParking.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [["created_at", "DESC"]],
      raw: true
    });

    res.status(200).json({
      message: "Boat parking list fetched successfully",
      data: list
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch boat parking list",
      error: error.message
    });
  }
});

module.exports = router;
