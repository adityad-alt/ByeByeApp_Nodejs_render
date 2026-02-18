const express = require("express");
const { BoatParkingBooking } = require("../models");
const auth = require("../middleware/auth");

const router = express.Router();

// POST - Create a boat parking booking (user_id stored from authenticated user)
router.post("/", auth, async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const {
      parking_id,
      parking_name,
      marina_name,
      location_name,
      full_address,
      customer_name,
      start_date,
      end_date,
      start_time,
      end_time,
      total_amount,
      currency,
      payment_status,
      transaction_id,
      booking_status,
      notes
    } = req.body;

    if (!start_date || !end_date) {
      return res.status(400).json({
        message: "start_date and end_date are required"
      });
    }

    // Build check_in / check_out from date + time (old structure compatibility)
    const parseDateTime = (dateStr, timeStr) => {
      if (!dateStr) return null;
      const d = new Date(dateStr);
      if (timeStr && typeof timeStr === "string") {
        const [h, m, s] = timeStr.split(":").map(Number);
        if (!isNaN(h)) d.setHours(h, m || 0, s || 0, 0);
      }
      return d;
    };
    const check_in = parseDateTime(start_date, start_time);
    const check_out = parseDateTime(end_date, end_time);
    let duration_hours = null;
    if (check_in && check_out && check_out > check_in) {
      duration_hours = Math.round((check_out - check_in) / (1000 * 60 * 60));
    }

    const booking = await BoatParkingBooking.create({
      user_id,
      customer_name: customer_name || null,
      parking_id: parking_id ?? null,
      parking_name: parking_name || null,
      marina_name: marina_name || null,
      location_name: location_name || null,
      full_address: full_address || null,
      start_date,
      end_date,
      start_time: start_time || null,
      end_time: end_time || null,
      check_in: check_in || null,
      check_out: check_out || null,
      duration_hours,
      total_amount: total_amount ?? null,
      currency: currency || "KWD",
      payment_status: payment_status || null,
      transaction_id: transaction_id || null,
      booking_status: booking_status || "booked",
      notes: notes || null
    });

    // Generate booking_code after we have id (e.g. BK-001)
    const booking_code = `BK-${String(booking.id).padStart(3, "0")}`;
    await booking.update({ booking_code });

    res.status(201).json({
      message: "Parking booking created successfully",
      data: (await BoatParkingBooking.findByPk(booking.id)).get()
    });
  } catch (error) {
    console.error("[boat_parking_bookings] POST error:", error.message);
    if (error.parent) console.error("[boat_parking_bookings] SQL/details:", error.parent.message || error.parent);
    res.status(500).json({
      message: "Failed to create parking booking",
      error: error.message
    });
  }
});

// GET - Get boat parking bookings by user id (authenticated user's bookings)
// Query: ?id= single booking | ?status= PAID|PENDING (payment_status) | ?booking_status= booked|cancelled|completed
router.get("/", auth, async (req, res) => {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { id, status, booking_status: queryBookingStatus } = req.query;

    if (id) {
      const booking = await BoatParkingBooking.findOne({
        where: { id, user_id }
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      return res.status(200).json({
        message: "Parking booking retrieved successfully",
        data: booking
      });
    }

    const where = { user_id };
    if (status != null && String(status).trim() !== "") {
      where.payment_status = String(status).trim().toUpperCase();
    }
    if (queryBookingStatus != null && String(queryBookingStatus).trim() !== "") {
      const v = String(queryBookingStatus).trim().toLowerCase();
      if (["booked", "cancelled", "completed"].includes(v)) {
        where.booking_status = v;
      }
    }

    const bookings = await BoatParkingBooking.findAll({
      where,
      order: [["start_date", "DESC"], ["created_at", "DESC"]]
    });

    res.status(200).json({
      message: "Parking bookings retrieved successfully",
      data: bookings
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve parking bookings",
      error: error.message
    });
  }
});

module.exports = router;
