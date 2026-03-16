const express = require("express");
const { AboutUs } = require("../models");

const router = express.Router();

// GET /about-us
// Returns the latest active About Us record (status = 1).
router.get("/", async (req, res) => {
  try {
    const record = await AboutUs.findOne({
      attributes: ["id", "title", "description", "image", "status", "created_at", "updated_at"],
      where: { status: 1 },
      order: [["created_at", "DESC"]],
      raw: true
    });

    if (!record) {
      return res.status(404).json({
        message: "About Us record not found",
        data: null
      });
    }

    return res.status(200).json({
      message: "About Us fetched successfully",
      data: record
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch About Us",
      error: error.message
    });
  }
});

module.exports = router;

