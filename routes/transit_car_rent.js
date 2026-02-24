const express = require("express");
const fs = require("fs");
const path = require("path");
const { TransitVehicle, TransitCarBooking } = require("../models");
const auth = require("../middleware/auth");
const optionalAuth = auth.optionalAuth;

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "../uploads/transit-licenses");

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

function saveBase64Image(base64Data, suffix) {
  if (!base64Data || typeof base64Data !== "string") return null;
  const match = base64Data.match(/^data:image\/\w+;base64,(.+)$/);
  const data = match ? match[1] : base64Data;
  try {
    ensureUploadDir();
    const filename = `${Date.now()}_${suffix}.jpg`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, Buffer.from(data, "base64"));
    return `transit-licenses/${filename}`;
  } catch (e) {
    return null;
  }
}

// Get list of all transit vehicles
router.get("/list", async (req, res) => {
  try {
    const vehicles = await TransitVehicle.findAll({
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"]
      ]
    });

    const data = vehicles.map((v) => (v.get ? v.get({ plain: true }) : v));

    res.status(200).json({
      message: "Transit vehicles list fetched successfully",
      table_name: TransitVehicle.tableName || "transit_vehicles",
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
        ["created_at", "DESC"],
        ["id", "DESC"]
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
      table_name: TransitVehicle.tableName || "transit_vehicles",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get brands and models",
      error: error.message
    });
  }
});

// Get current user's car rental bookings (auth required; filter by customer_id like BoatBooking)
router.get("/my-bookings", auth, async (req, res) => {
  try {
    const customer_id = req.user?.id;
    if (customer_id == null || customer_id === undefined) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    const bookings = await TransitCarBooking.findAll({
      where: { customer_id },
      order: [["created_at", "DESC"]]
    });

    const data = bookings.map((b) => (b.get ? b.get({ plain: true }) : b));

    res.status(200).json({
      message: "My car rental bookings fetched successfully",
      customer_id: customer_id,
      table_name: TransitCarBooking.tableName || "transit_car_bookings",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get my car rental bookings",
      error: error.message
    });
  }
});

// Parse "d/m/y" to "yyyy-mm-dd"
function parseDateDMY(str) {
  if (!str || typeof str !== "string") return null;
  const parts = str.trim().split(/[/-]/);
  if (parts.length !== 3) return null;
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const y = parseInt(parts[2], 10);
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
  const pad = (n) => (n < 10 ? "0" + n : String(n));
  return `${y}-${pad(m)}-${pad(d)}`;
}

// Parse "HH:mm" to "HH:mm:ss"
function parseTime(str) {
  if (!str || typeof str !== "string") return null;
  const m = str.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = m[1].padStart(2, "0");
  const min = m[2];
  return `${h}:${min}:00`;
}

// Add car rental booking (optional auth: if Bearer token present, auto-fills customer_id from logged-in user)
router.post("/booking", optionalAuth, async (req, res) => {
  try {
    const {
      brand,
      model,
      vehicle_number,
      customer_id,
      full_name,
      contact_details,
      email_id,
      address,
      start_date,
      start_time,
      end_date,
      end_time,
      driving_license_front,
      driving_license_back,
      driving_license_front_base64,
      driving_license_back_base64,
      dob,
      nationality,
      amount,
      payment_type
    } = req.body;

    // When logged in: always use token user id (so booking appears in my-bookings).
    // When guest: use body customer_id if provided, else null.
    const customerId =
      req.user?.id ??
      (customer_id != null && customer_id !== "" ? Number(customer_id) : null);

    const licenseFrontPath =
      saveBase64Image(driving_license_front_base64, "front") ||
      driving_license_front ||
      "";
    const licenseBackPath =
      saveBase64Image(driving_license_back_base64, "back") ||
      driving_license_back ||
      "";

    const startDateStr = parseDateDMY(start_date) || start_date;
    const endDateStr = parseDateDMY(end_date) || end_date;
    const startTimeStr = parseTime(start_time) || start_time;
    const endTimeStr = parseTime(end_time) || end_time;

    const booking = await TransitCarBooking.create({
      brand: brand || null,
      model: model || null,
      vehicle_number: vehicle_number || null,
      customer_id: customerId ?? null,
      full_name: full_name || null,
      contact_details: contact_details || null,
      email_id: email_id || null,
      address: address || null,
      start_date: startDateStr,
      start_time: startTimeStr,
      end_date: endDateStr,
      end_time: endTimeStr,
      driving_license_front: licenseFrontPath || null,
      driving_license_back: licenseBackPath || null,
      dob: dob || null,
      nationality: nationality || null,
      amount: amount || null,
      payment_type: payment_type || null,
      STATUS: "Pending"
    });

    const data = booking.get ? booking.get({ plain: true }) : booking;

    res.status(201).json({
      message: "Booking created successfully",
      customer_id: customerId,
      table_name: TransitCarBooking.tableName || "transit_car_bookings",
      data: {
        booking_id: data.booking_id,
        customer_id: customerId,
        ...data
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create booking",
      error: error.message
    });
  }
});

module.exports = router;
