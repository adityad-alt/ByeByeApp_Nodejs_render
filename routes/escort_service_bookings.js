const express = require("express");
const { EscortBooking } = require("../models");
const auth = require("../middleware/auth");
const optionalAuth = auth.optionalAuth;

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

// GET / - List escort bookings
// Query: ?id= - single by id
//        ?user_id= - filter by user (for "my bookings")
// GET /my-bookings - auth required, returns current user's bookings
router.get("/", async (req, res) => {
  try {
    const { id, user_id } = req.query;

    if (id) {
      const booking = await EscortBooking.findOne({
        where: { id: Number(id) || id }
      });
      if (!booking) {
        return res.status(404).json({ message: "Escort booking not found" });
      }
      const data = booking.get ? booking.get({ plain: true }) : booking;
      return res.status(200).json({
        message: "Escort booking fetched successfully",
        data
      });
    }

    const where = {};
    if (user_id != null && user_id !== "") {
      where.user_id = Number(user_id);
    }

    const bookings = await EscortBooking.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [["created_at", "DESC"]],
      raw: true
    });

    res.status(200).json({
      message: "Escort bookings list fetched successfully",
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch escort bookings",
      error: error.message
    });
  }
});

// GET /my-bookings - Get current user's escort bookings (auth required)
router.get("/my-bookings", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const bookings = await EscortBooking.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      raw: true
    });

    res.status(200).json({
      message: "My escort bookings fetched successfully",
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch my escort bookings",
      error: error.message
    });
  }
});

// POST / - Create escort booking (optional auth: if Bearer token present, auto-fills user_id)
router.post("/", optionalAuth, async (req, res) => {
  try {
    const {
      user_id,
      full_name,
      contact_number,
      email_id,
      escort_service_type,
      vip_service_type,
      request_date,
      request_time,
      start_date,
      end_date,
      start_time,
      end_time,
      location,
      primary_location,
      special_requests,
      additional_notes,
      additional_locations
    } = req.body;

    const userId =
      req.user?.id ??
      (user_id != null && user_id !== "" ? Number(user_id) : null);

    const reqDateStr = request_date ? parseDateDMY(request_date) || request_date : null;
    const reqTimeStr = request_time ? parseTime(request_time) || request_time : null;
    const startDateStr = start_date ? parseDateDMY(start_date) || start_date : null;
    const endDateStr = end_date ? parseDateDMY(end_date) || end_date : null;
    const startTimeStr = start_time ? parseTime(start_time) || start_time : null;
    const endTimeStr = end_time ? parseTime(end_time) || end_time : null;
    const bookingId = `ESC-${Date.now()}`;

    const booking = await EscortBooking.create({
      booking_id: bookingId,
      user_id: userId ?? null,
      full_name: full_name || null,
      contact_number: contact_number || null,
      email_id: email_id || null,
      escort_service_type: escort_service_type || null,
      vip_service_type: vip_service_type || null,
      request_date: reqDateStr,
      request_time: reqTimeStr,
      start_date: startDateStr,
      end_date: endDateStr,
      start_time: startTimeStr,
      end_time: endTimeStr,
      location: location || null,
      primary_location: primary_location || null,
      special_requests: special_requests || null,
      additional_notes: additional_notes || null,
      additional_locations: additional_locations ? 1 : 0,
      status: "Pending"
    });

    const data = booking.get ? booking.get({ plain: true }) : booking;

    res.status(201).json({
      message: "Escort booking created successfully",
      user_id: userId,
      data: {
        id: data.id,
        booking_id: data.booking_id,
        user_id: userId,
        ...data
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create escort booking",
      error: error.message
    });
  }
});

module.exports = router;
