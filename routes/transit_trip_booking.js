const express = require("express");
const { TransitTripBooking } = require("../models");
const auth = require("../middleware/auth");
const optionalAuth = auth.optionalAuth;

const router = express.Router();

// Get current user's pickup/drop (trip) bookings (auth required; filter by customer_id)
router.get("/my-bookings", auth, async (req, res) => {
  try {
    const customer_id = req.user?.id;
    if (customer_id == null || customer_id === undefined) {
      return res.status(401).json({
        message: "User not authenticated"
      });
    }

    const bookings = await TransitTripBooking.findAll({
      where: { customer_id },
      order: [["created_at", "DESC"]]
    });

    const data = bookings.map((b) => (b.get ? b.get({ plain: true }) : b));

    res.status(200).json({
      message: "My pickup/drop bookings fetched successfully",
      customer_id: customer_id,
      table_name: TransitTripBooking.tableName || "transit_trip_bookings",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get my pickup/drop bookings",
      error: error.message
    });
  }
});

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

// Add trip booking (optional auth: if Bearer token present, auto-fills customer_id from logged-in user)
router.post("/booking", optionalAuth, async (req, res) => {
  try {
    const {
      trip_id,
      customer_id,
      brand,
      model,
      passenger_name,
      contact_number,
      email_id,
      pickup_address,
      drop_address,
      trip_date,
      trip_time,
      fare,
      payment_method
    } = req.body;

    const customerId =
      req.user?.id ??
      (customer_id != null && customer_id !== "" ? Number(customer_id) : null);

    const tripDateStr = parseDateDMY(trip_date) || trip_date;
    const tripTimeStr = parseTime(trip_time) || trip_time;
    const fareNum = parseFare(fare);
    const generatedTripId = trip_id || `TRIP-${Date.now()}`;

    const booking = await TransitTripBooking.create({
      trip_id: generatedTripId,
      customer_id: customerId ?? null,
      brand: brand || null,
      model: model || null,
      passenger_name: passenger_name || null,
      contact_number: contact_number || null,
      email_id: email_id || null,
      pickup_address: pickup_address || null,
      drop_address: drop_address || null,
      trip_date: tripDateStr,
      trip_time: tripTimeStr,
      driver_details: null,
      driver_contact_number: null,
      fare: fareNum,
      payment_method: payment_method || null,
      payment_status: "Pending",
      trip_status: "Booked"
    });

    const data = booking.get ? booking.get({ plain: true }) : booking;

    res.status(201).json({
      message: "Trip booking created successfully",
      customer_id: customerId,
      table_name: TransitTripBooking.tableName || "transit_trip_bookings",
      data: {
        id: data.id,
        trip_id: data.trip_id,
        customer_id: customerId,
        ...data
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create trip booking",
      error: error.message
    });
  }
});

module.exports = router;
