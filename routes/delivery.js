const express = require("express");
const { Op } = require("sequelize");
const {
  DeliveryOrder,
  GlobalgoLocalShipment,
  GlobalgoSeaCargoShipment,
  GlobalgoInternationalShipment,
  GlobalgoCarShipment
} = require("../models");
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

/** Deduplicate non-empty string values from an array of Sequelize raw records. */
function distinct(rows, field) {
  const seen = new Set();
  const result = [];
  for (const row of rows) {
    const val = (row[field] ?? "").toString().trim();
    if (val && !seen.has(val)) {
      seen.add(val);
      result.push(val);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// GET /delivery/options?type=local|sea_cargo|international|car_delivery
// Returns dropdown options for each delivery type from the dedicated tables.
// ---------------------------------------------------------------------------
router.get("/options", async (req, res) => {
  try {
    const { type, country } = req.query;

    if (!type) {
      return res.status(400).json({ message: "type query param is required" });
    }

    switch (type) {
      case "local": {
        const where = {};
        if (country && country.trim()) where.country = country.trim();
        const rows = await GlobalgoLocalShipment.findAll({ where, raw: true });
        return res.json({
          message: "Local shipment options fetched",
          data: {
            pickup_cities: distinct(rows, "pickup_city"),
            drop_off_cities: distinct(rows, "drop_off_city"),
            countries: distinct(rows, "country")
          }
        });
      }

      case "sea_cargo": {
        const rows = await GlobalgoSeaCargoShipment.findAll({ raw: true });
        return res.json({
          message: "Sea cargo options fetched",
          data: {
            origin_ports: distinct(rows, "origin_port"),
            destination_ports: distinct(rows, "destination_port"),
            container_types: distinct(rows, "container_type")
          }
        });
      }

      case "international": {
        const rows = await GlobalgoInternationalShipment.findAll({ raw: true });
        return res.json({
          message: "International shipment options fetched",
          data: {
            pickup_countries: distinct(rows, "pickup_country"),
            pickup_cities: distinct(rows, "pickup_city"),
            destination_countries: distinct(rows, "destination_country"),
            destination_cities: distinct(rows, "destination_city")
          }
        });
      }

      case "car_delivery": {
        const where = {};
        if (country && country.trim()) where.country = country.trim();
        const rows = await GlobalgoCarShipment.findAll({ where, raw: true });
        return res.json({
          message: "Car shipment options fetched",
          data: {
            car_types: distinct(rows, "car_type"),
            pickup_cities: distinct(rows, "pickup_city"),
            drop_off_cities: distinct(rows, "drop_off_city"),
            countries: distinct(rows, "country")
          }
        });
      }

      default:
        return res.status(400).json({ message: `Unknown type: ${type}` });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch options", error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Config CRUD – manage records in the four shipment tables (admin use)
// GET    /delivery/config?type=local|sea_cargo|international|car_delivery
// POST   /delivery/config          body: { type, ...fields }
// PUT    /delivery/config/:id?type=...  body: { ...fields }
// DELETE /delivery/config/:id?type=...
// ---------------------------------------------------------------------------
function modelForType(type) {
  switch (type) {
    case "local":         return GlobalgoLocalShipment;
    case "sea_cargo":     return GlobalgoSeaCargoShipment;
    case "international": return GlobalgoInternationalShipment;
    case "car_delivery":  return GlobalgoCarShipment;
    default:              return null;
  }
}

router.get("/config", async (req, res) => {
  const { type } = req.query;
  const Model = modelForType(type);
  if (!Model) {
    return res.status(400).json({ message: "type is required: local | sea_cargo | international | car_delivery" });
  }
  try {
    const rows = await Model.findAll({ raw: true });
    res.json({ message: "Config records fetched", data: rows });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch config", error: error.message });
  }
});

router.post("/config", async (req, res) => {
  const { type, ...fields } = req.body;
  const Model = modelForType(type);
  if (!Model) {
    return res.status(400).json({ message: "type is required: local | sea_cargo | international | car_delivery" });
  }
  try {
    const record = await Model.create(fields);
    const data = record.get ? record.get({ plain: true }) : record;
    res.status(201).json({ message: "Config record created", data });
  } catch (error) {
    res.status(500).json({ message: "Failed to create config record", error: error.message });
  }
});

router.put("/config/:id", async (req, res) => {
  const { type, ...fields } = req.body;
  const resolvedType = type || req.query.type;
  const Model = modelForType(resolvedType);
  if (!Model) {
    return res.status(400).json({ message: "type is required: local | sea_cargo | international | car_delivery" });
  }
  try {
    const record = await Model.findOne({ where: { id: Number(req.params.id) } });
    if (!record) return res.status(404).json({ message: "Record not found" });
    await record.update(fields);
    const data = record.get ? record.get({ plain: true }) : record;
    res.json({ message: "Config record updated", data });
  } catch (error) {
    res.status(500).json({ message: "Failed to update config record", error: error.message });
  }
});

router.delete("/config/:id", async (req, res) => {
  const resolvedType = req.body?.type || req.query.type;
  const Model = modelForType(resolvedType);
  if (!Model) {
    return res.status(400).json({ message: "type is required: local | sea_cargo | international | car_delivery" });
  }
  try {
    const record = await Model.findOne({ where: { id: Number(req.params.id) } });
    if (!record) return res.status(404).json({ message: "Record not found" });
    await record.destroy();
    res.json({ message: "Config record deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete config record", error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /delivery – list delivery orders
// ---------------------------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    const { id, user_id } = req.query;

    if (id) {
      const order = await DeliveryOrder.findOne({ where: { id: Number(id) || id } });
      if (!order) return res.status(404).json({ message: "Delivery order not found" });
      const data = order.get ? order.get({ plain: true }) : order;
      return res.status(200).json({ message: "Delivery order fetched successfully", data });
    }

    const where = {};
    if (user_id != null && user_id !== "") where.user_id = Number(user_id);

    const orders = await DeliveryOrder.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [["created_at", "DESC"]],
      raw: true
    });

    res.status(200).json({ message: "Delivery orders list fetched successfully", data: orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch delivery orders", error: error.message });
  }
});

// ---------------------------------------------------------------------------
// GET /delivery/my-orders – current user's orders (auth required)
// ---------------------------------------------------------------------------
router.get("/my-orders", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not authenticated" });

    const orders = await DeliveryOrder.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      raw: true
    });

    res.status(200).json({ message: "My delivery orders fetched successfully", data: orders });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch my delivery orders", error: error.message });
  }
});

// ---------------------------------------------------------------------------
// POST /delivery – create delivery order
// ---------------------------------------------------------------------------
router.post("/", async (req, res) => {
  try {
    const {
      user_id, delivery_type,
      pickup_city, drop_off_city,
      pickup_country, destination_country, destination_city,
      origin_port, destination_port, container_type,
      car_type,
      approximate_value, dimensions, weight,
      pick_up_address, delivery_address,
      full_name, contact_details, email_id,
      schedule_date, time_slot_index, payment_type
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
      data: { id: data.id, booking_id: data.booking_id, ...data }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create delivery order", error: error.message });
  }
});

module.exports = router;
