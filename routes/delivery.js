const express = require("express");
const { DeliveryOrder, DeliverySelectionConfig } = require("../models");
const auth = require("../middleware/auth");

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

// GET / - List delivery orders
// Query: ?id= - single by id
//        ?user_id= - filter by user (for "my orders")
router.get("/", async (req, res) => {
  try {
    const { id, user_id } = req.query;

    if (id) {
      const order = await DeliveryOrder.findOne({
        where: { id: Number(id) || id }
      });
      if (!order) {
        return res.status(404).json({ message: "Delivery order not found" });
      }
      const data = order.get ? order.get({ plain: true }) : order;
      return res.status(200).json({
        message: "Delivery order fetched successfully",
        data
      });
    }

    const where = {};
    if (user_id != null && user_id !== "") {
      where.user_id = Number(user_id);
    }

    const orders = await DeliveryOrder.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [["created_at", "DESC"]],
      raw: true
    });

    res.status(200).json({
      message: "Delivery orders list fetched successfully",
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch delivery orders",
      error: error.message
    });
  }
});

// GET /my-orders - Get current user's delivery orders (auth required)
router.get("/my-orders", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const orders = await DeliveryOrder.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      raw: true
    });

    res.status(200).json({
      message: "My delivery orders fetched successfully",
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch my delivery orders",
      error: error.message
    });
  }
});

/**
 * GET /locations
 * Returns selection data for delivery flows (e.g. active local cities).
 *
 * Query params:
 *   delivery_type: 'local' | 'international' | 'sea_cargo' | 'car_delivery'
 *   country: Country name (e.g. 'Kuwait') - optional but recommended for 'local'/'international'
 *
 * Example:
 *   GET /delivery/locations?delivery_type=local&country=Kuwait
 *   -> [{ city_name: 'Kuwait City' }, { city_name: 'Hawally' }, ...]
 */
router.get("/locations", async (req, res) => {
  try {
    const { delivery_type, country } = req.query;

    if (!delivery_type) {
      return res.status(400).json({
        message: "delivery_type is required"
      });
    }

    const where = {
      delivery_type,
      is_active: true
    };

    if (country && country.trim() !== "") {
      where.country_name = country.trim();
    }

    const records = await DeliverySelectionConfig.findAll({
      where,
      order: [
        ["sort_order", "ASC"],
        ["city_name", "ASC"]
      ],
      raw: true
    });

    // For local delivery we primarily care about city_name; Flutter side
    // already knows how to pick 'city_name' from each item.
    res.status(200).json({
      message: "Delivery locations fetched successfully",
      data: records
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch delivery locations",
      error: error.message
    });
  }
});

/**
 * POST /locations
 * Create a new delivery selection config record.
 *
 * Expected JSON body:
 *   {
 *     delivery_type: 'local' | 'international' | 'sea_cargo' | 'car_delivery', // required
 *     country_name: 'Kuwait',                                                  // required
 *     country_code: 'KW',                                                      // optional
 *     city_name: 'Kuwait City',                                               // optional
 *     port_name: 'Shuwaikh Port',                                             // optional
 *     car_type: 'SUV',                                                        // optional
 *     is_pickup: true,                                                        // optional, default false
 *     is_dropoff: true,                                                       // optional, default false
 *     is_active: true,                                                        // optional, default true
 *     sort_order: 1                                                           // optional, default 0
 *   }
 */
router.post("/locations", async (req, res) => {
  try {
    const {
      delivery_type,
      country_name,
      country_code,
      city_name,
      port_name,
      car_type,
      is_pickup,
      is_dropoff,
      is_active,
      sort_order
    } = req.body;

    if (!delivery_type || !country_name) {
      return res.status(400).json({
        message: "delivery_type and country_name are required"
      });
    }

    const record = await DeliverySelectionConfig.create({
      delivery_type,
      country_name: country_name.trim(),
      country_code: country_code ?? null,
      city_name: city_name ?? null,
      port_name: port_name ?? null,
      car_type: car_type ?? null,
      is_pickup: typeof is_pickup === "boolean" ? is_pickup : false,
      is_dropoff: typeof is_dropoff === "boolean" ? is_dropoff : false,
      is_active: typeof is_active === "boolean" ? is_active : true,
      sort_order:
        typeof sort_order === "number" && !Number.isNaN(sort_order)
          ? sort_order
          : 0
    });

    const data = record.get ? record.get({ plain: true }) : record;

    res.status(201).json({
      message: "Delivery location created successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create delivery location",
      error: error.message
    });
  }
});

// POST / - Create delivery order (no auth required for guest; pass user_id in body if logged in)
router.post("/", async (req, res) => {
  try {
    const {
      user_id,
      delivery_type,
      pickup_city,
      drop_off_city,
      pickup_country,
      destination_country,
      destination_city,
      origin_port,
      destination_port,
      container_type,
      car_type,
      approximate_value,
      dimensions,
      weight,
      pick_up_address,
      delivery_address,
      full_name,
      contact_details,
      email_id,
      schedule_date,
      time_slot_index,
      payment_type
    } = req.body;

    const scheduleDateStr = schedule_date
      ? parseDateDMY(schedule_date) || schedule_date
      : null;
    const bookingId = `DEL-${Date.now()}`;

    const order = await DeliveryOrder.create({
      booking_id: bookingId,
      user_id: user_id != null && user_id !== "" ? Number(user_id) : null,
      delivery_type: delivery_type || null,
      pickup_city: pickup_city || null,
      drop_off_city: drop_off_city || null,
      pickup_country: pickup_country || null,
      destination_country: destination_country || null,
      destination_city: destination_city || null,
      origin_port: origin_port || null,
      destination_port: destination_port || null,
      container_type: container_type || null,
      car_type: car_type || null,
      approximate_value: approximate_value || null,
      dimensions: dimensions || null,
      weight: weight || null,
      pick_up_address: pick_up_address || null,
      delivery_address: delivery_address || null,
      full_name: full_name || null,
      contact_details: contact_details || null,
      email_id: email_id || null,
      schedule_date: scheduleDateStr,
      time_slot_index:
        time_slot_index != null && time_slot_index !== ""
          ? Number(time_slot_index)
          : null,
      payment_type: payment_type || null,
      status: "Pending"
    });

    const data = order.get ? order.get({ plain: true }) : order;

    res.status(201).json({
      message: "Delivery order created successfully",
      data: {
        id: data.id,
        booking_id: data.booking_id,
        ...data
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create delivery order",
      error: error.message
    });
  }
});

module.exports = router;
