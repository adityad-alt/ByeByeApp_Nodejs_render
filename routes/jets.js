const express = require("express");
const { Jet, JetBooking } = require("../models");

const router = express.Router();

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

// GET / - List jets (optional: ?status=ACTIVE|INACTIVE, ?id= for single)
router.get("/", async (req, res) => {
  try {
    const { status, id } = req.query;
    const where = {};

    if (status && ["ACTIVE", "INACTIVE"].includes(String(status).toUpperCase())) {
      where.status = String(status).toUpperCase();
    }

    if (id) {
      const jet = await Jet.findOne({
        where: { id: Number(id) || id }
      });
      if (!jet) {
        return res.status(404).json({ message: "Jet not found" });
      }
      const data = jet.get ? jet.get({ plain: true }) : jet;
      return res.status(200).json({
        message: "Jet fetched successfully",
        data
      });
    }

    const jets = await Jet.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [
        ["manufacturer", "ASC"],
        ["model", "ASC"]
      ],
      raw: true
    });

    res.status(200).json({
      message: "Jets list fetched successfully",
      data: jets
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

// POST /jets/booking - Create jet booking
router.post("/booking", async (req, res) => {
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

    const tripDateStr = parseDateDMY(trip_date) || trip_date;
    const tripTimeStr = parseTime(trip_time) || trip_time;
    const returnDateStr = return_date ? parseDateDMY(return_date) || return_date : null;
    const returnTimeStr = return_time ? parseTime(return_time) || return_time : null;
    const fareNum = parseFare(fare);
    const bookingId = `JET-${Date.now()}`;

    const booking = await JetBooking.create({
      booking_id: bookingId,
      user_id: user_id != null ? Number(user_id) : null,
      jet_id: jet_id != null ? Number(jet_id) : null,
      manufacturer: manufacturer || null,
      model: model || null,
      passenger_name: passenger_name || null,
      contact_number: contact_number || null,
      email_id: email_id || null,
      departure: departure || null,
      destination: destination || null,
      trip_date: tripDateStr,
      trip_time: tripTimeStr,
      return_date: returnDateStr,
      return_time: returnTimeStr,
      passengers: passengers || null,
      jet_type: jet_type || null,
      fare: fareNum,
      payment_method: payment_method || null,
      payment_status: "Pending",
      booking_status: "Pending"
    });

    const data = booking.get ? booking.get({ plain: true }) : booking;

    res.status(201).json({
      message: "Jet booking created successfully",
      data: {
        id: data.id,
        booking_id: data.booking_id,
        ...data
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create jet booking",
      error: error.message
    });
  }
});

module.exports = router;
