const express = require("express");
const { BoatBanner } = require("../models");
const router = express.Router();

// Get list of advertisements (banners); optional query: status=ACTIVE|INACTIVE
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && ["ACTIVE", "INACTIVE"].includes(String(status).toUpperCase())) {
      where.STATUS = String(status).toUpperCase();
    }

    const banners = await BoatBanner.findAll({
      attributes: [
        "id",
        "banner_title",
        "link_url",
        "banner_image",
        "STATUS",
        "created_at",
        "updated_at"
      ],
      where: Object.keys(where).length ? where : undefined,
      order: [["created_at", "DESC"]],
      raw: true
    });

    res.status(200).json({
      message: "Advertisements fetched successfully",
      data: banners
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch advertisements",
      error: error.message
    });
  }
});

// Get single advertisement details by id
router.get("/:id", async (req, res) => {
  try {
    const banner = await BoatBanner.findByPk(req.params.id, {
      attributes: [
        "id",
        "banner_title",
        "link_url",
        "banner_image",
        "STATUS",
        "created_at",
        "updated_at"
      ],
      raw: true
    });

    if (!banner) {
      return res.status(404).json({ message: "Advertisement not found" });
    }

    res.status(200).json({
      message: "Advertisement details fetched successfully",
      data: banner
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch advertisement details",
      error: error.message
    });
  }
});

module.exports = router;
