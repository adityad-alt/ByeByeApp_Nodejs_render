const express = require("express");
const { BoatBookingTransaction, BoatBookingAddon, BoatDestination } = require("../models");
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

// Add addons for a booking (id = app_boat_booking_transactions.id)
// POST /boat-bookings/addons
// Body: { booking_id, items: [{ source_type, source_id, quantity?, unit_price, total_price?, name? }, ...] }
router.post("/addons", auth, async (req, res) => {
  try {
    const { booking_id, items } = req.body;
    const customerId = req.user?.id;

    if (!booking_id) {
      return res.status(400).json({
        message: "booking_id is required"
      });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "items array is required and must not be empty"
      });
    }

    const booking = await BoatBookingTransaction.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (customerId && booking.customer_id != null && booking.customer_id !== customerId) {
      return res.status(403).json({ message: "You are not allowed to modify this booking" });
    }

    const allowedTypes = new Set([
      "boat_addon_item",
      "boat_addon_restaurant",
      "boat_special_package",
      "boat_product"
    ]);

    const rows = [];
    for (const item of items) {
      const { source_type, source_id, quantity, unit_price, total_price, name } = item || {};
      if (!source_type || !allowedTypes.has(String(source_type))) {
        return res.status(400).json({
          message: `Invalid source_type: ${source_type}`
        });
      }
      if (source_id == null) {
        return res.status(400).json({
          message: "source_id is required for each item"
        });
      }
      if (unit_price == null) {
        return res.status(400).json({
          message: "unit_price is required for each item"
        });
      }
      const qty = quantity != null ? Number(quantity) : 1;
      const unit = Number(unit_price);
      const total = total_price != null ? Number(total_price) : unit * qty;
      const addonName = name != null && String(name).trim() !== "" ? String(name).trim() : null;

      rows.push({
        booking_id,
        source_type: String(source_type),
        source_id,
        quantity: qty,
        unit_price: unit,
        total_price: total,
        name: addonName
      });
    }

    const created = await BoatBookingAddon.bulkCreate(rows, { returning: true });

    res.status(201).json({
      message: "Booking addons created successfully",
      data: created
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create booking addons",
      error: error.message
    });
  }
});

// Get addons for a booking (id = app_boat_booking_transactions.id)
// GET /boat-bookings/addons?booking_id=ID
router.get("/addons", auth, async (req, res) => {
  try {
    const { booking_id } = req.query;
    const customerId = req.user?.id;

    if (!booking_id) {
      return res.status(400).json({
        message: "booking_id query param is required"
      });
    }

    const booking = await BoatBookingTransaction.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (customerId && booking.customer_id != null && booking.customer_id !== customerId) {
      return res.status(403).json({ message: "You are not allowed to view these addons" });
    }

    const addons = await BoatBookingAddon.findAll({
      where: { booking_id },
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"]
      ],
      raw: true
    });

    res.status(200).json({
      message: "Booking addons fetched successfully",
      data: addons
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch booking addons",
      error: error.message
    });
  }
});

// Create a destination (latitude/longitude)
// POST /boat-bookings/destinations
// Body: { latitude, longitude }
router.post("/destinations", auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (latitude == null || longitude == null) {
      return res.status(400).json({
        message: "latitude and longitude are required"
      });
    }

    const destination = await BoatDestination.create({
      latitude,
      longitude
    });

    res.status(201).json({
      message: "Destination created successfully",
      data: destination
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create destination",
      error: error.message
    });
  }
});

// Get destinations (all, by ID, or within 100km of lat/long)
// GET /boat-bookings/destinations
//   ?id=ID  -> single destination
//   ?latitude=LAT&longitude=LNG  or  body: { latitude, longitude }  -> list within 100km
//   (no id, no lat/long)  -> all destinations
router.get("/destinations", auth, async (req, res) => {
  try {
    const { id } = req.query;
    // Accept lat/long from query or body
    const latitude = req.query.latitude ?? req.body?.latitude;
    const longitude = req.query.longitude ?? req.body?.longitude;

    if (id) {
      const destination = await BoatDestination.findByPk(id);

      if (!destination) {
        return res.status(404).json({ message: "Destination not found" });
      }

      return res.status(200).json({
        message: "Destination retrieved successfully",
        data: destination
      });
    }

    // If lat/long provided, return only destinations within 100km (Haversine)
    if (latitude != null && longitude != null) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return res.status(400).json({
          message: "latitude and longitude must be valid numbers"
        });
      }

      const sequelize = BoatDestination.sequelize;
      const tableName = BoatDestination.tableName;
      const destinations = await sequelize.query(
        `SELECT id, latitude, longitude,
          ( 6371 * 2 * ASIN(SQRT(
            POWER(SIN(RADIANS(latitude - :lat)), 2) +
            COS(RADIANS(:lat)) * COS(RADIANS(latitude)) *
            POWER(SIN(RADIANS(longitude - :lng)), 2)
          )) ) AS distance_km
         FROM \`${tableName}\`
         HAVING distance_km <= 100
         ORDER BY distance_km ASC`,
        { replacements: { lat, lng }, type: sequelize.QueryTypes.SELECT }
      );

      return res.status(200).json({
        message: "Destinations within 100km retrieved successfully",
        data: destinations
      });
    }

    const destinations = await BoatDestination.findAll({
      order: [["id", "ASC"]]
    });

    res.status(200).json({
      message: "Destinations retrieved successfully",
      data: destinations
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve destinations",
      error: error.message
    });
  }
});

// Get bookings (all or by ID) for the authenticated user
router.get("/get-bookings", auth, async (req, res) => {
  try {
    const customer_id = req.user?.id;
    const { id } = req.query;

    if (id) {
      // Fetch specific booking transaction by ID (must belong to user)
      const booking = await BoatBookingTransaction.findOne({
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

    // Fetch all booking transactions for user (newest first)
    const bookings = await BoatBookingTransaction.findAll({
      where: { customer_id },
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"]
      ]
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
