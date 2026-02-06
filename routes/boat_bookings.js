const express = require("express");
const { BoatBooking, BoatBookingTransaction } = require("../models");
const auth = require("../middleware/auth");

const router = express.Router();

router.post("/create-booking", auth, async (req, res) => {
  try {
    const {
      order_id,
      boat_id,
      boat_name,
      boat_image_url,
      boat_address,
      customer_id,
      customer_name,
      customer_contact,
      customer_email,
      booking_date,
      start_time,
      end_time,
      captain_name,
      captain_image_url,
      destination_name,
      destination_price,
      destination_time,
      pick_up_address,
      subtotal,
      discount_amount,
      coupon_code,
      total_amount,
      price_per_hour,
      transaction_type,
      transaction_id,
      payment_status,
      items,
      items_json,
      booking_status
    } = req.body;

    const customerId = customer_id ?? req.user?.id;

    // Validate required fields
    if (!boat_id || !booking_date || !start_time || !end_time) {
      return res.status(400).json({
        message: "boat_id, booking_date, start_time and end_time are required"
      });
    }

    const itemsData = items_json ?? (Array.isArray(items) ? items : null);

    const transaction = await BoatBookingTransaction.create({
      order_id: order_id || null,
      boat_id,
      boat_name: boat_name || null,
      boat_image_url: boat_image_url || null,
      boat_address: boat_address || null,
      customer_id: customerId,
      customer_name: customer_name || null,
      customer_contact: customer_contact || null,
      customer_email: customer_email || null,
      booking_date,
      start_time,
      end_time,
      captain_name: captain_name || null,
      captain_image_url: captain_image_url || null,
      destination_name: destination_name || null,
      destination_price: destination_price ?? null,
      destination_time: destination_time || null,
      pick_up_address: pick_up_address || null,
      subtotal: subtotal ?? null,
      discount_amount: discount_amount ?? 0,
      coupon_code: coupon_code || null,
      total_amount: total_amount ?? null,
      price_per_hour: price_per_hour || null,
      transaction_type: transaction_type || null,
      transaction_id: transaction_id || null,
      payment_status: payment_status || null,
      items_json: itemsData,
      booking_status: booking_status || "booked"
    });

    res.status(201).json({ message: "Booking created successfully", data: transaction });
  } catch (error) {
    res.status(500).json({ message: "Failed to create booking", error: error.message });
  }
});

// Get bookings (all or by ID) for the authenticated user
router.get("/get-bookings", auth, async (req, res) => {
  try {
    const customer_id = req.user?.id;
    const { id } = req.query;

    if (id) {
      // Fetch specific booking by ID (must belong to user)
      const booking = await BoatBooking.findOne({
        where: { id, customer_id }
      });

      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      return res.status(200).json({ 
        message: "Booking retrieved successfully", 
        data: booking 
      });
    }

    // Fetch all bookings for user
    const bookings = await BoatBooking.findAll({
      where: { customer_id },
      order: [["booking_date", "DESC"]]
    });

    res.status(200).json({ 
      message: "Bookings retrieved successfully", 
      data: bookings 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to retrieve bookings", 
      error: error.message 
    });
  }
});

module.exports = router;
