const express = require("express");
const { TransitVehicle } = require("../models");

const router = express.Router();

// Get list of all transit vehicles
router.get("/list", async (req, res) => {
  try {
    const vehicles = await TransitVehicle.findAll({
      order: [
        ["brand", "ASC"],
        ["model", "ASC"]
      ]
    });

    const data = vehicles.map((v) => (v.get ? v.get({ plain: true }) : v));

    res.status(200).json({
      message: "Transit vehicles list fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get transit vehicles list",
      error: error.message
    });
  }
});

// Get list of brands and their models (brand X has models [a, b, c, ...])
router.get("/brands-models", async (req, res) => {
  try {
    const vehicles = await TransitVehicle.findAll({
      attributes: ["brand", "model"],
      order: [
        ["brand", "ASC"],
        ["model", "ASC"]
      ],
      raw: true
    });

    const byBrand = {};
    for (const row of vehicles) {
      const brand = (row.brand || "").trim() || "Unknown";
      const model = (row.model || "").trim();
      if (!byBrand[brand]) byBrand[brand] = [];
      if (model && !byBrand[brand].includes(model)) {
        byBrand[brand].push(model);
      }
    }

    const data = Object.entries(byBrand).map(([brand, models]) => ({
      brand,
      models
    }));

    res.status(200).json({
      message: "Brands and models fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get brands and models",
      error: error.message
    });
  }
});

module.exports = router;
