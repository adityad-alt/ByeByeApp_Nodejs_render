const express = require("express");
const { AppUserBoat, AppUserAddress } = require("../models");
const auth = require("../middleware/auth");

const router = express.Router();

// POST /user-details/boats - Add user boat
router.post("/boats", auth, async (req, res) => {
  try {
    const {
      boat_name,
      height,
      width,
      boat_type,
      civil_id_image,
      license_image,
      additional_images
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    const boat = await AppUserBoat.create({
      user_id: userId,
      boat_name: boat_name || null,
      height: height || null,
      width: width || null,
      boat_type: boat_type || null,
      civil_id_image: civil_id_image || null,
      license_image: license_image || null,
      additional_images: Array.isArray(additional_images)
        ? JSON.stringify(additional_images)
        : typeof additional_images === "string"
          ? additional_images
          : null
    });

    res.status(201).json({
      message: "Boat added successfully",
      data: boat
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add boat",
      error: error.message
    });
  }
});

// GET /user-details/boats - Get user's boats
router.get("/boats", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    const boats = await AppUserBoat.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      raw: true
    });

    res.status(200).json({
      message: "User boats fetched successfully",
      data: boats
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user boats",
      error: error.message
    });
  }
});

// POST /user-details/addresses - Add user address
router.post("/addresses", auth, async (req, res) => {
  try {
    const {
      governorate,
      area,
      block,
      street,
      building,
      floor,
      flat,
      is_default
    } = req.body;

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    const isDefault = is_default === true || is_default === 1 || is_default === "1";
    if (isDefault) {
      await AppUserAddress.update(
        { is_default: 0 },
        { where: { user_id: userId } }
      );
    }

    const address = await AppUserAddress.create({
      user_id: userId,
      governorate: governorate || null,
      area: area || null,
      block: block || null,
      street: street || null,
      building: building || null,
      floor: floor || null,
      flat: flat || null,
      is_default: isDefault ? 1 : 0
    });

    res.status(201).json({
      message: "Address added successfully",
      data: address
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add address",
      error: error.message
    });
  }
});

// GET /user-details/addresses - Get user's addresses
router.get("/addresses", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    const addresses = await AppUserAddress.findAll({
      where: { user_id: userId },
      order: [
        ["is_default", "DESC"],
        ["created_at", "DESC"]
      ],
      raw: true
    });

    res.status(200).json({
      message: "User addresses fetched successfully",
      data: addresses
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch user addresses",
      error: error.message
    });
  }
});

module.exports = router;
