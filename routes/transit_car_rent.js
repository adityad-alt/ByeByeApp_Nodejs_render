const express = require("express");
const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
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

// Haversine helpers: distance between two lat/long points in kilometers
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function distanceInKm(lat1, lon1, lat2, lon2) {
  if (lat2 == null || lon2 == null) return null;
  const n1 = Number(lat1);
  const n2 = Number(lon1);
  const n3 = Number(lat2);
  const n4 = Number(lon2);

  if ([n1, n2, n3, n4].some((v) => Number.isNaN(v))) {
    return null;
  }

  const R = 6371; // km
  const dLat = toRad(n3 - n1);
  const dLon = toRad(n4 - n2);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(n1)) * Math.cos(toRad(n3)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Get list of all transit vehicles (optional:
// - lat, long, radius_km for distance-based filtering (default radius 100km))
router.get("/list", async (req, res) => {
  try {
    const { lat: userLat, long: userLong, radius_km: radiusKm } = req.query;

    const vehicles = await TransitVehicle.findAll({
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"]
      ],
      raw: true
    });

    let data = vehicles;

    const hasUserLocation =
      userLat != null && userLat !== "" && userLong != null && userLong !== "";
    const parsedRadius =
      radiusKm != null && radiusKm !== "" ? Number(radiusKm) : 100;
    const radius =
      Number.isFinite(parsedRadius) && parsedRadius > 0 ? parsedRadius : 100;

    if (hasUserLocation) {
      const userLatNum = Number(userLat);
      const userLongNum = Number(userLong);

      if (!Number.isNaN(userLatNum) && !Number.isNaN(userLongNum)) {
        data = data
          .map((item) => {
            const vLat = item.lat;
            const vLong = item.long;
            const dist = distanceInKm(userLatNum, userLongNum, vLat, vLong);
            return { ...item, distance_km: dist };
          })
          .filter((v) => v && (v.distance_km == null || v.distance_km <= radius))
          .sort((a, b) => a.distance_km - b.distance_km);
      }
    }

    data = data.map(applyFormattedPrices);

    res.status(200).json({
      message: "Transit vehicles list fetched successfully",
      table_name: TransitVehicle.tableName || "globalgo_vehicles",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get transit vehicles list",
      error: error.message
    });
  }
});

// Parse price string (e.g. "KWD 50" or "50.00") to number
function parsePriceNum(val) {
  if (val == null) return null;
  if (typeof val === "number" && !isNaN(val)) return val;
  const s = String(val).trim().replace(/[^\d.]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// Format price for API: returns numeric string (e.g. "35.222"). Returns null for dummy/invalid.
// Currency is in separate column, no need to prepend it to price.
function formatTransitPrice(val) {
  if (val == null || val === "") return null;
  const s = String(val).trim();
  if (!s || s.length > 50) return null;
  const num = parsePriceNum(s);
  if (num == null || !Number.isFinite(num)) return null;
  return Number(num).toFixed(3).replace(/\.?0+$/, "");
}

// Apply formatted prices to vehicle for API response (uses currency col for reference)
function applyFormattedPrices(item) {
  if (!item || typeof item !== "object") return item;
  const curr = item.currency || "KWD";
  const ph = formatTransitPrice(item.price_per_hour);
  const pd = formatTransitPrice(item.price_per_day);
  return {
    ...item,
    price_per_hour: ph ?? pd,
    price_per_day: pd ?? ph,
    currency: curr,
    cover_image: item.cover_image ?? null
  };
}

// GET /transit-car-rent/filter - Filter vehicles by brand, model, fuel_type, price, seat_capacity, location
router.get("/filter", async (req, res) => {
  try {
    const {
      lat: userLat,
      long: userLong,
      radius_km: radiusKm,
      brand,
      model,
      fuel_type,
      min_price,
      max_price,
      seat_capacity
    } = req.query;

    const vehicles = await TransitVehicle.findAll({
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"]
      ],
      raw: true
    });

    let data = vehicles;

    // Apply brand filter
    if (brand && String(brand).trim() !== "") {
      data = data.filter(
        (v) => String(v.brand || "").toLowerCase() === String(brand).trim().toLowerCase()
      );
    }

    // Apply model filter
    if (model && String(model).trim() !== "") {
      data = data.filter(
        (v) => String(v.model || "").toLowerCase() === String(model).trim().toLowerCase()
      );
    }

    // Apply fuel_type filter
    if (fuel_type && String(fuel_type).trim() !== "") {
      data = data.filter(
        (v) =>
          String(v.fuel_type || "").toLowerCase() === String(fuel_type).trim().toLowerCase()
      );
    }

    // Apply seat_capacity filter
    if (seat_capacity != null && seat_capacity !== "") {
      const cap = Number(seat_capacity);
      if (Number.isFinite(cap)) {
        data = data.filter((v) => Number(v.seat_capacity) >= cap);
      }
    }

    // Apply price filter (price_per_day only)
    const minP = min_price != null && min_price !== "" ? parsePriceNum(min_price) : null;
    const maxP = max_price != null && max_price !== "" ? parsePriceNum(max_price) : null;
    if (minP != null || maxP != null) {
      data = data.filter((v) => {
        const pd = parsePriceNum(v.price_per_day);
        if (pd == null) return true; // Include vehicles with no price data
        if (minP != null && pd < minP) return false;
        if (maxP != null && pd > maxP) return false;
        return true;
      });
    }

    // Apply location radius filter
    const hasUserLocation =
      userLat != null && userLat !== "" && userLong != null && userLong !== "";
    const parsedRadius =
      radiusKm != null && radiusKm !== "" ? Number(radiusKm) : 100;
    const radius =
      Number.isFinite(parsedRadius) && parsedRadius > 0 ? parsedRadius : 100;

    if (hasUserLocation) {
      const userLatNum = Number(userLat);
      const userLongNum = Number(userLong);

      if (!Number.isNaN(userLatNum) && !Number.isNaN(userLongNum)) {
        const withDist = data.map((item) => {
          const vLat = item.lat;
          const vLong = item.long;
          // Null/undefined coords = unknown location; treat as null distance (include in noLocation)
          if (vLat == null || vLong == null || Number.isNaN(Number(vLat)) || Number.isNaN(Number(vLong))) {
            return { ...item, distance_km: null };
          }
          const dist = distanceInKm(userLatNum, userLongNum, vLat, vLong);
          return { ...item, distance_km: dist };
        });
        const inRadius = withDist.filter(
          (v) => v.distance_km != null && v.distance_km <= radius
        );
        const noLocation = withDist.filter((v) => v.distance_km == null);
        data = [...inRadius.sort((a, b) => a.distance_km - b.distance_km), ...noLocation];
      }
    }

    data = data.map(applyFormattedPrices);

    res.status(200).json({
      message: "Filtered vehicles fetched successfully",
      table_name: TransitVehicle.tableName || "globalgo_vehicles",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to filter transit vehicles",
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
      table_name: TransitVehicle.tableName || "globalgo_vehicles",
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
      table_name: TransitCarBooking.tableName || "globalgo_car_bookings",
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
// Also decrements vehicle stock and toggles is_available when stock reaches 0.
router.post("/booking", optionalAuth, async (req, res) => {
  const t = TransitCarBooking.sequelize?.transaction
    ? await TransitCarBooking.sequelize.transaction()
    : null;

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

    // Find the corresponding vehicle to adjust stock.
    const vehicleWhere = {};
    if (vehicle_number) {
      vehicleWhere.registration_no = vehicle_number;
    } else {
      if (brand) vehicleWhere.brand = brand;
      if (model) vehicleWhere.model = model;
    }

    const vehicle = await TransitVehicle.findOne({
      where: vehicleWhere,
      transaction: t || undefined
    });

    if (!vehicle) {
      if (t) await t.rollback();
      return res.status(404).json({
        message: "Vehicle not found for booking"
      });
    }

    const currentStockRaw =
      vehicle.inventory_numbers != null
        ? Number(vehicle.inventory_numbers)
        : Number(vehicle.inventory_numbers ?? 0);
    const currentStock = Number.isFinite(currentStockRaw)
      ? currentStockRaw
      : 0;
    const isAvailableFlag =
      vehicle.is_available === 1 ||
      vehicle.is_available === true ||
      vehicle.is_available === "1";

    if (!isAvailableFlag || currentStock <= 0) {
      if (t) await t.rollback();
      return res.status(400).json({
        message: "Vehicle is out of stock"
      });
    }

    const booking = await TransitCarBooking.create(
      {
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
      },
      t ? { transaction: t } : undefined
    );

    // Decrement stock by 1 and toggle availability if needed.
    const newStock = currentStock - 1;
    vehicle.inventory_numbers = String(newStock);
    if (newStock <= 0) {
      vehicle.is_available = 0;
    }
    await vehicle.save(t ? { transaction: t } : undefined);

    if (t) await t.commit();

    const data = booking.get ? booking.get({ plain: true }) : booking;

    res.status(201).json({
      message: "Booking created successfully",
      customer_id: customerId,
      table_name: TransitCarBooking.tableName || "globalgo_car_bookings",
      data: {
        booking_id: data.booking_id,
        customer_id: customerId,
        ...data
      }
    });
  } catch (error) {
    if (t) await t.rollback();
    res.status(500).json({
      message: "Failed to create booking",
      error: error.message
    });
  }
});

module.exports = router;
