const express = require("express");
const { BoatAmenity } = require("../models");

const router = express.Router();

// GET /amenities – list amenities or fetch a single amenity by name.
// Query params:
// - status: optional, "active" | "inactive"
// - name: optional, if provided returns a single amenity (404 if not found)
router.get("/", async (req, res) => {
  try {
    const { status, name } = req.query;
    const where = {};

    if (status && ["active", "inactive"].includes(String(status).toLowerCase())) {
      where.STATUS = String(status).toLowerCase();
    }

    const hasName = name != null && String(name).trim() !== "";
    if (hasName) {
      where.NAME = String(name).trim();
      const row = await BoatAmenity.findOne({
        attributes: ["id", "NAME", "icon_image", "description", "STATUS"],
        where,
        raw: true
      });
      if (!row) {
        return res.status(404).json({
          message: "Amenity not found",
          data: null
        });
      }
      const amenity = {
        id: row.id,
        name: row.NAME ?? "",
        icon_image: row.icon_image ?? null,
        description: row.description ?? null,
        STATUS: row.STATUS ?? null
      };
      return res.status(200).json({
        message: "Amenity fetched successfully",
        data: amenity
      });
    }

    const rows = await BoatAmenity.findAll({
      attributes: ["id", "NAME", "icon_image", "description", "STATUS"],
      where: Object.keys(where).length ? where : undefined,
      order: [["NAME", "ASC"]],
      raw: true
    });

    const amenities = rows.map((r) => ({
      id: r.id,
      name: r.NAME ?? "",
      icon_image: r.icon_image ?? null,
      description: r.description ?? null,
      STATUS: r.STATUS ?? null
    }));

    res.status(200).json({
      message: "Amenities list fetched successfully",
      data: amenities
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get amenities list",
      error: error.message
    });
  }
});

module.exports = router;

