const express = require("express");
const { Op } = require("sequelize");
const { Jet, JetBooking } = require("../models");
const auth = require("../middleware/auth");
const optionalAuth = auth.optionalAuth;
const router = express.Router();

// Note: Previously dummy/placeholder jets (e.g. names containing "Dummy" or "globalgo_jets")
// were excluded via a Sequelize WHERE clause. That logic has been removed so that
// those rows are now included in API responses as requested.

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

function parseTime(str) {
  if (!str || typeof str !== "string") return null;
  const m = str.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = m[1].padStart(2, "0");
  const min = m[2];
  return `${h}:${min}:00`;
}

function parseFare(str) {
  if (str == null) return null;
  if (typeof str === "number" && !isNaN(str)) return str;
  const s = String(str).trim().replace(/[^\d.]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function parsePriceToNum(val) {
  if (val == null) return null;
  if (typeof val === "number" && !Number.isNaN(val)) return val;
  const s = String(val).trim().replace(/[^\d.]/g, "");
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

// Format jet price for API: returns numeric string (e.g. "35.222"). Returns null for invalid strings.
function formatJetPrice(val) {
  if (val == null || val === "") return null;
  const s = String(val).trim();
  if (!s || s.length > 50) return null;
  const num = parsePriceToNum(s);
  if (num == null || !Number.isFinite(num)) return null;
  return Number(num).toFixed(3).replace(/\.?0+$/, "");
}

// Apply formatted prices to jet for API response
function applyFormattedJets(item) {
  if (!item || typeof item !== "object") return item;
  const ph = formatJetPrice(item.price_per_hour);
  const pt = formatJetPrice(item.price_per_trip);
  return {
    ...item,
    price_per_hour: ph ?? pt,
    price_per_trip: pt ?? ph,
    cover_image: item.cover_image ?? null
  };
}

// GET /jets/filter - Filter jets by jet_type, manufacturer, model, departure, destination,
// passenger_capacity, cruise_speed, price, location
router.get("/filter", async (req, res) => {
  try {
    const {
      jet_type,
      manufacturer,
      model,
      departure,
      destination,
      passenger_capacity,
      min_speed,
      max_speed,
      min_price,
      max_price,
      lat: userLat,
      long: userLong,
      radius_km: radiusKm
    } = req.query;

    const andConditions = [{ status: "ACTIVE" }];
    if (jet_type && String(jet_type).trim()) {
      andConditions.push({ jet_type: { [Op.like]: `%${String(jet_type).trim()}%` } });
    }
    if (manufacturer && String(manufacturer).trim()) {
      andConditions.push({ manufacturer: { [Op.like]: `%${String(manufacturer).trim()}%` } });
    }
    if (model && String(model).trim()) {
      andConditions.push({ model: { [Op.like]: `%${String(model).trim()}%` } });
    }
    if (departure && String(departure).trim()) {
      andConditions.push({ departure: { [Op.like]: `%${String(departure).trim()}%` } });
    }
    if (destination && String(destination).trim()) {
      andConditions.push({ destination: { [Op.like]: `%${String(destination).trim()}%` } });
    }
    if (passenger_capacity != null && passenger_capacity !== "") {
      const cap = Number(passenger_capacity);
      if (Number.isFinite(cap)) andConditions.push({ passenger_capacity: cap });
    }

    const jets = await Jet.findAll({
      where: { [Op.and]: andConditions },
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"]
      ],
      raw: true
    });

    let data = jets.map((j) => (j.get ? j.get({ plain: true }) : j));

    const minSpeedNum = min_speed != null && min_speed !== "" ? Number(min_speed) : null;
    const maxSpeedNum = max_speed != null && max_speed !== "" ? Number(max_speed) : null;
    if (minSpeedNum != null && Number.isFinite(minSpeedNum)) {
      data = data.filter((j) => {
        const s = Number(j.cruise_speed_kmh);
        return Number.isFinite(s) && s >= minSpeedNum;
      });
    }
    if (maxSpeedNum != null && Number.isFinite(maxSpeedNum)) {
      data = data.filter((j) => {
        const s = Number(j.cruise_speed_kmh);
        return Number.isFinite(s) && s <= maxSpeedNum;
      });
    }

    const minPriceNum = min_price != null && min_price !== "" ? parsePriceToNum(min_price) : null;
    const maxPriceNum = max_price != null && max_price !== "" ? parsePriceToNum(max_price) : null;
    if (minPriceNum != null || maxPriceNum != null) {
      data = data.filter((j) => {
        const ph = parsePriceToNum(j.price_per_hour);
        const pt = parsePriceToNum(j.price_per_trip);
        const p = Math.min(ph ?? Infinity, pt ?? Infinity);
        const pMax = Math.max(ph ?? 0, pt ?? 0);
        if (p === Infinity && pMax === 0) return true; // Include jets with no price data
        if (minPriceNum != null && Number.isFinite(minPriceNum) && p < minPriceNum) return false;
        if (maxPriceNum != null && Number.isFinite(maxPriceNum) && pMax > maxPriceNum) return false;
        return true;
      });
    }

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
          const jetLat = item.lat;
          const jetLong = item.long;
          if (jetLat == null || jetLong == null || Number.isNaN(Number(jetLat)) || Number.isNaN(Number(jetLong))) {
            return { ...item, distance_km: null };
          }
          const dist = distanceInKm(userLatNum, userLongNum, jetLat, jetLong);
          return { ...item, distance_km: dist };
        });
        const inRadius = withDist.filter((j) => j.distance_km != null && j.distance_km <= radius);
        const noLocation = withDist.filter((j) => j.distance_km == null);
        data = [...inRadius.sort((a, b) => a.distance_km - b.distance_km), ...noLocation];
      }
    }

    data = data.map(applyFormattedJets);

    res.status(200).json({
      message: "Filtered jets fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to filter jets",
      error: error.message
    });
  }
});

// GET / - List jets (optional:
// - status=ACTIVE|INACTIVE
// - id= for single jet
// - lat, long, radius_km for distance-based filtering (default radius 100km))
router.get("/", async (req, res) => {
  try {
    const { status, id, lat: userLat, long: userLong, radius_km: radiusKm } = req.query;
    const andConditions = [];
    if (status && ["ACTIVE", "INACTIVE"].includes(String(status).toUpperCase())) {
      andConditions.push({ status: String(status).toUpperCase() });
    }

    if (id) {
      const jet = await Jet.findOne({
        where: { id: Number(id) || id },
        raw: true
      });
      if (!jet) {
        return res.status(404).json({ message: "Jet not found" });
      }
      const data = applyFormattedJets(jet);
      return res.status(200).json({
        message: "Jet fetched successfully",
        data
      });
    }

    const listWhere = { [Op.and]: andConditions };
    const jets = await Jet.findAll({
      where: listWhere,
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"]
      ],
      raw: true
    });

    let data = jets;

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
        const withDist = jets.map((item) => {
          const jetLat = item.lat;
          const jetLong = item.long;
          if (jetLat == null || jetLong == null || Number.isNaN(Number(jetLat)) || Number.isNaN(Number(jetLong))) {
            return { ...item, distance_km: null };
          }
          const dist = distanceInKm(userLatNum, userLongNum, jetLat, jetLong);
          return { ...item, distance_km: dist };
        });
        const inRadius = withDist.filter((j) => j.distance_km != null && j.distance_km <= radius);
        const noLocation = withDist.filter((j) => j.distance_km == null);
        data = [...inRadius.sort((a, b) => a.distance_km - b.distance_km), ...noLocation];
      }
    }

    data = data.map(applyFormattedJets);

    res.status(200).json({
      message: "Jets list fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch jets list",
      error: error.message
    });
  }
});

// POST / - Add a jet
router.post("/", async (req, res) => {
  try {
    const {
      manufacturer,
      model,
      passenger_capacity,
      range_km,
      cruise_speed_kmh,
      price_per_hour,
      price_per_trip,
      description,
      images,
      jet_type,
      departure,
      destination,
      status
    } = req.body;

    const jet = await Jet.create({
      manufacturer: manufacturer || null,
      model: model || null,
      passenger_capacity:
        passenger_capacity != null ? Number(passenger_capacity) : null,
      range_km: range_km != null ? Number(range_km) : null,
      cruise_speed_kmh:
        cruise_speed_kmh != null ? Number(cruise_speed_kmh) : null,
      price_per_hour: price_per_hour || null,
      price_per_trip: price_per_trip || null,
      description: description || null,
      images: images || null,
      jet_type: jet_type || null,
      departure: departure || null,
      destination: destination || null,
      status: status || "ACTIVE"
    });

    const data = jet.get ? jet.get({ plain: true }) : jet;

    res.status(201).json({
      message: "Jet added successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add jet",
      error: error.message
    });
  }
});

// GET /jets/my-bookings - Get current user's jet bookings (auth required; filter by user_id)
router.get("/my-bookings", auth, async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (user_id == null || user_id === undefined) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    const bookings = await JetBooking.findAll({
      where: { user_id },
      order: [["created_at", "DESC"]]
    });

    const data = bookings.map((b) => (b.get ? b.get({ plain: true }) : b));

    res.status(200).json({
      message: "My jet bookings fetched successfully",
      user_id: user_id,
      table_name: JetBooking.tableName || "globalgo_jet_booking",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get my jet bookings",
      error: error.message
    });
  }
});

// POST /jets/booking - Create jet booking (optional auth: if Bearer token present, auto-fills user_id)
// Also decrements available_stock and sets status to INACTIVE when stock reaches 0.
router.post("/booking", optionalAuth, async (req, res) => {
  const t = JetBooking.sequelize?.transaction
    ? await JetBooking.sequelize.transaction()
    : null;

  try {
    const {
      user_id,
      jet_id,
      manufacturer,
      model,
      passenger_name,
      contact_number,
      email_id,
      departure,
      destination,
      trip_date,
      trip_time,
      return_date,
      return_time,
      passengers,
      jet_type,
      fare,
      payment_method
    } = req.body;

    const userId =
      req.user?.id ??
      (user_id != null && user_id !== "" ? Number(user_id) : null);

    const tripDateStr = parseDateDMY(trip_date) || trip_date;
    const tripTimeStr = parseTime(trip_time) || trip_time;
    const returnDateStr = return_date ? parseDateDMY(return_date) || return_date : null;
    const returnTimeStr = return_time ? parseTime(return_time) || return_time : null;
    const fareNum = parseFare(fare);
    const bookingId = `JET-${Date.now()}`;

    // Find the jet to adjust stock.
    const where = {};
    if (jet_id != null) {
      where.id = Number(jet_id) || jet_id;
    } else {
      if (manufacturer) where.manufacturer = manufacturer;
      if (model) where.model = model;
    }

    const jet = await Jet.findOne({
      where,
      transaction: t || undefined
    });

    if (!jet) {
      if (t) await t.rollback();
      return res.status(404).json({
        message: "Jet not found for booking"
      });
    }

    const currentStockRaw =
      jet.available_stock != null ? Number(jet.available_stock) : 0;
    const currentStock = Number.isFinite(currentStockRaw) ? currentStockRaw : 0;
    const isActiveStatus =
      String(jet.status || "").toUpperCase() === "ACTIVE";

    if (!isActiveStatus || currentStock <= 0) {
      if (t) await t.rollback();
      return res.status(400).json({
        message: "Jet is out of stock"
      });
    }

    const booking = await JetBooking.create(
      {
        booking_id: bookingId,
        user_id: userId ?? null,
        jet_id: jet.id,
        manufacturer: manufacturer || jet.manufacturer || null,
        model: model || jet.model || null,
        passenger_name: passenger_name || null,
        contact_number: contact_number || null,
        email_id: email_id || null,
        departure: departure || jet.departure || null,
        destination: destination || jet.destination || null,
        trip_date: tripDateStr,
        trip_time: tripTimeStr,
        return_date: returnDateStr,
        return_time: returnTimeStr,
        passengers: passengers || null,
        jet_type: jet_type || jet.jet_type || null,
        fare: fareNum,
        payment_method: payment_method || null,
        payment_status: "Pending",
        booking_status: "Pending"
      },
      t ? { transaction: t } : undefined
    );

    // Decrement stock and mark inactive when 0.
    const newStock = currentStock - 1;
    jet.available_stock = newStock;
    if (newStock <= 0) {
      jet.status = "INACTIVE";
    }
    await jet.save(t ? { transaction: t } : undefined);

    if (t) await t.commit();

    const data = booking.get ? booking.get({ plain: true }) : booking;

    res.status(201).json({
      message: "Jet booking created successfully",
      user_id: userId,
      table_name: JetBooking.tableName || "globalgo_jet_booking",
      data: {
        id: data.id,
        booking_id: data.booking_id,
        user_id: userId,
        ...data
      }
    });
  } catch (error) {
    if (t) await t.rollback();
    res.status(500).json({
      message: "Failed to create jet booking",
      error: error.message
    });
  }
});

module.exports = router;
