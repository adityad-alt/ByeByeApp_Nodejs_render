const express = require("express");
const { Op } = require("sequelize");
const {
  AppUserBoat,
  AppUserAddress,
  BoatBookingTransaction,
  BoatParkingBooking,
  JetBooking,
  ChaletBooking,
  TransitCarBooking,
  TransitTripBooking,
  CateringOrder,
  ShopOrder,
  DeliveryOrder,
  EscortBooking
} = require("../models");
const auth = require("../middleware/auth");

const router = express.Router();

// Helpers for "active" (not cancelled) and "paid" (for total spent)
const notCancelled = (col) => ({ [col]: { [Op.notIn]: ["cancelled", "Cancelled", "CANCELLED"] } });
const paidStatus = { [Op.or]: [{ [Op.like]: "%paid%" }, { [Op.eq]: "Paid" }, { [Op.eq]: "PAID" } ] };

// GET /user-details/dashboard-stats — active bookings count + total spent (from existing tables)
router.get("/dashboard-stats", auth, async (req, res) => {
  try {
    const userId = req.user?.id ?? req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    let activeBookings = 0;
    let totalSpent = 0;

    // ——— Active count: bookings where user is owner and status is not cancelled ———
    activeBookings += await BoatBookingTransaction.count({
      where: { customer_id: userId, ...notCancelled("booking_status") }
    }).catch(() => 0);

    activeBookings += await BoatParkingBooking.count({
      where: { user_id: userId, ...notCancelled("booking_status") }
    }).catch(() => 0);

    activeBookings += await JetBooking.count({
      where: { user_id: userId, booking_status: { [Op.notIn]: ["Cancelled", "cancelled"] } }
    }).catch(() => 0);

    activeBookings += await ChaletBooking.count({
      where: { customer_id: userId, ...notCancelled("booking_status") }
    }).catch(() => 0);

    activeBookings += await TransitCarBooking.count({
      where: { customer_id: userId, STATUS: { [Op.notIn]: ["Cancelled", "cancelled"] } }
    }).catch(() => 0);

    activeBookings += await TransitTripBooking.count({
      where: { customer_id: userId, trip_status: { [Op.notIn]: ["Cancelled", "cancelled"] } }
    }).catch(() => 0);

    activeBookings += await CateringOrder.count({
      where: { user_id: userId, status: { [Op.notIn]: ["cancelled", "Cancelled"] } }
    }).catch(() => 0);

    activeBookings += await ShopOrder.count({
      where: { user_id: userId, status: { [Op.notIn]: ["cancelled", "Cancelled"] } }
    }).catch(() => 0);

    activeBookings += await DeliveryOrder.count({
      where: { user_id: userId }
    }).catch(() => 0);

    activeBookings += await EscortBooking.count({
      where: { user_id: userId }
    }).catch(() => 0);

    // ——— Total spent: sum amounts where payment is paid (or booking not cancelled) ———
    const toNum = (v) => (v == null ? 0 : Number(v));

    const boatTxRows = await BoatBookingTransaction.findAll({
      attributes: ["total_amount"],
      where: { customer_id: userId, payment_status: paidStatus },
      raw: true
    }).catch(() => []);
    totalSpent += boatTxRows.reduce((s, r) => s + toNum(r.total_amount), 0);

    const parkingRows = await BoatParkingBooking.findAll({
      attributes: ["total_amount"],
      where: { user_id: userId, payment_status: paidStatus },
      raw: true
    }).catch(() => []);
    totalSpent += parkingRows.reduce((s, r) => s + toNum(r.total_amount), 0);

    const jetRows = await JetBooking.findAll({
      attributes: ["fare"],
      where: { user_id: userId, payment_status: paidStatus },
      raw: true
    }).catch(() => []);
    totalSpent += jetRows.reduce((s, r) => s + toNum(r.fare), 0);

    const chaletRows = await ChaletBooking.findAll({
      attributes: ["total_amount"],
      where: { customer_id: userId, ...notCancelled("booking_status") },
      raw: true
    }).catch(() => []);
    totalSpent += chaletRows.reduce((s, r) => s + toNum(r.total_amount), 0);

    const carRows = await TransitCarBooking.findAll({
      attributes: ["amount"],
      where: { customer_id: userId },
      raw: true
    }).catch(() => []);
    totalSpent += carRows.reduce((s, r) => s + toNum(r.amount), 0);

    const tripRows = await TransitTripBooking.findAll({
      attributes: ["fare"],
      where: { customer_id: userId, payment_status: paidStatus },
      raw: true
    }).catch(() => []);
    totalSpent += tripRows.reduce((s, r) => s + toNum(r.fare), 0);

    const cateringRows = await CateringOrder.findAll({
      attributes: ["total"],
      where: { user_id: userId, payment_status: paidStatus },
      raw: true
    }).catch(() => []);
    totalSpent += cateringRows.reduce((s, r) => s + toNum(r.total), 0);

    const shopRows = await ShopOrder.findAll({
      attributes: ["total"],
      where: { user_id: userId, status: { [Op.notIn]: ["cancelled", "Cancelled"] } },
      raw: true
    }).catch(() => []);
    totalSpent += shopRows.reduce((s, r) => s + toNum(r.total), 0);

    res.status(200).json({
      message: "Dashboard stats fetched",
      data: {
        activeBookings: Math.max(0, activeBookings),
        totalSpent: Math.round(totalSpent * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch dashboard stats",
      error: error.message
    });
  }
});

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
