const express = require("express");
const { TransitTripBooking } = require("../models");

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

router.post("/booking", async (req, res) => {
  try {
    const {
      trip_id,
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

    const tripDateStr = parseDateDMY(trip_date) || trip_date;
    const tripTimeStr = parseTime(trip_time) || trip_time;
    const fareNum = parseFare(fare);
    const generatedTripId = trip_id || `TRIP-${Date.now()}`;

    const booking = await TransitTripBooking.create({
      trip_id: generatedTripId,
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
      data: {
        id: data.id,
        trip_id: data.trip_id,
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
