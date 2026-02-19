const express = require("express");
const { Chalet, ChaletBooking } = require("../models");
const auth = require("../middleware/auth");
const optionalAuth = auth.optionalAuth;

const router = express.Router();

// GET /chalets — health check for chalet API
router.get("/", (req, res) => {
  res.json({ message: "Chalets API", routes: ["GET /chalets/list", "GET /chalets/chalet-details/:id", "POST /chalets/booking", "GET /chalets/my-bookings"] });
});

const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || "https://alltestserver.space/BYEBYE";

// Exclude rate_night and price_per_day from API responses
const CHALET_ATTRIBUTES = { exclude: ["rate_night", "price_per_day"] };

function toFullImageUrl(path) {
  if (!path || typeof path !== "string") return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const base = IMAGE_BASE_URL.endsWith("/") ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
  const p = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${p}`;
}

function normalizeChaletDetail(row) {
  if (!row) return null;
  const r = row.get ? row.get({ plain: true }) : { ...row };
  const primaryImg = r.primary_image_url ?? r.image_url ?? "";
  r.image_url = primaryImg ? toFullImageUrl(primaryImg) : null;
  r.primary_image_url = r.image_url;
  if (r.amenities_json != null && typeof r.amenities_json === "string") {
    try {
      const parsed = JSON.parse(r.amenities_json);
      r.amenities = Array.isArray(parsed) ? parsed : (parsed && typeof parsed === "object" ? Object.values(parsed) : []);
    } catch (_) {
      r.amenities = [];
    }
  } else {
    r.amenities = [];
  }
  return r;
}

function normalizeChaletListItem(row) {
  if (!row) return null;
  const r = row.get ? row.get({ plain: true }) : { ...row };
  const primaryImg = r.primary_image_url ?? r.image_url ?? "";
  r.image_url = primaryImg ? toFullImageUrl(primaryImg) : null;
  return r;
}

// GET /chalets/chalet-details/:id — get single chalet (excludes rate_night, price_per_day)
router.get("/chalet-details/:id", async (req, res) => {
  try {
    const chalet = await Chalet.findByPk(req.params.id, {
      attributes: CHALET_ATTRIBUTES
    });
    if (!chalet) {
      return res.status(404).json({ message: "Chalet not found" });
    }
    res.status(200).json({
      message: "Chalet details fetched successfully",
      data: normalizeChaletDetail(chalet)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get chalet details", error: error.message });
  }
});

// GET /chalets/list — list chalets for booking screen (excludes rate_night, price_per_day)
const listChalets = async (req, res) => {
  try {
    const list = await Chalet.findAll({
      attributes: CHALET_ATTRIBUTES,
      order: [["id", "DESC"]]
    });
    res.status(200).json({
      message: "Chalet list fetched successfully",
      data: list.map(normalizeChaletListItem).filter(Boolean)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get chalet list", error: error.message });
  }
};
router.get("/list", listChalets);
router.get("/list/", listChalets);

// ——— Chalet Bookings (table: chalet_bookings) ———

// GET /chalets/my-bookings — get current user's chalet bookings (auth required)
router.get("/my-bookings", auth, async (req, res) => {
  try {
    const customer_id = req.user?.id;
    if (customer_id == null || customer_id === undefined) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    const bookings = await ChaletBooking.findAll({
      where: { customer_id },
      order: [["created_at", "DESC"]]
    });
    const data = bookings.map((b) => (b.get ? b.get({ plain: true }) : b));
    res.status(200).json({
      message: "My chalet bookings fetched successfully",
      customer_id,
      table_name: ChaletBooking.tableName || "chalet_bookings",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get my chalet bookings",
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

function parseAmount(val) {
  if (val == null) return null;
  if (typeof val === "number" && !isNaN(val)) return val;
  const s = String(val).trim().replace(/[^\d.]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// POST /chalets/booking — create a chalet booking (optional auth: fills customer_id if logged in)
router.post("/booking", optionalAuth, async (req, res) => {
  try {
    const {
      chalet_id,
      customer_id: bodyCustomerId,
      check_in_date,
      check_out_date,
      guest_name,
      contact_number,
      email_id,
      total_amount,
      booking_status,
      notes
    } = req.body;

    const customerId =
      req.user?.id ??
      (bodyCustomerId != null && bodyCustomerId !== "" ? Number(bodyCustomerId) : null);

    const chaletId = chalet_id != null && chalet_id !== "" ? Number(chalet_id) : null;
    if (chaletId == null || isNaN(chaletId)) {
      return res.status(400).json({ message: "chalet_id is required" });
    }

    const checkInStr = parseDateDMY(check_in_date) || (typeof check_in_date === "string" ? check_in_date : null);
    const checkOutStr = parseDateDMY(check_out_date) || (typeof check_out_date === "string" ? check_out_date : null);
    const amountNum = parseAmount(total_amount);

    const booking = await ChaletBooking.create({
      chalet_id: chaletId,
      customer_id: customerId ?? null,
      check_in_date: checkInStr,
      check_out_date: checkOutStr ?? checkInStr,
      guest_name: guest_name || null,
      contact_number: contact_number || null,
      email_id: email_id || null,
      total_amount: amountNum,
      booking_status: booking_status || "booked",
      notes: notes || null
    });

    const data = booking.get ? booking.get({ plain: true }) : booking;
    res.status(201).json({
      message: "Chalet booking created successfully",
      customer_id: customerId,
      table_name: ChaletBooking.tableName || "chalet_bookings",
      data: { id: data.id, chalet_id: data.chalet_id, ...data }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create chalet booking",
      error: error.message
    });
  }
});

// POST /chalets — create a chalet (all body fields optional; response excludes rate_night, price_per_day)
const CREATABLE_KEYS = [
  "name", "description", "address", "price_per_night", "bedrooms", "bathrooms",
  "max_guests", "image_url", "status", "owner_id", "category_id", "sub_category_id",
  "type", "title", "title_ar", "max_persons", "max_stay_days", "total_rooms",
  "price_per_day", "rate_night", "area_m2", "year_built", "amenities_json", "primary_image_url"
];

router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const payload = {};
    for (const key of CREATABLE_KEYS) {
      if (body[key] !== undefined && body[key] !== null) {
        payload[key] = body[key];
      }
    }
    if (body.amenities !== undefined && body.amenities !== null) {
      payload.amenities_json =
        typeof body.amenities === "string" ? body.amenities : JSON.stringify(body.amenities);
    }
    const chalet = await Chalet.create(payload);
    const data = normalizeChaletDetail(
      await Chalet.findByPk(chalet.id, { attributes: CHALET_ATTRIBUTES })
    );
    res.status(201).json({
      message: "Chalet created successfully",
      data
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create chalet", error: error.message });
  }
});

/*
  POST /chalets — sample body:

  {
    "name": "Sunset Villa",
    "title": "Sunset Villa",
    "title_ar": "فيلا الغروب",
    "description": "A cozy chalet with sea view and private pool.",
    "address": "Al Jahra, Kuwait",
    "price_per_night": 150.00,
    "bedrooms": 3,
    "bathrooms": 2,
    "max_guests": 6,
    "max_persons": 6,
    "max_stay_days": 14,
    "total_rooms": 4,
    "area_m2": "180",
    "year_built": "2020",
    "type": "villa",
    "status": "available",
    "owner_id": 1,
    "category_id": 1,
    "sub_category_id": 1,
    "image_url": "/chalets/sunset-villa.jpg",
    "primary_image_url": "/chalets/sunset-villa.jpg",
    "amenities": ["WiFi", "Pool", "Parking", "AC", "Kitchen"]
  }

  All fields are optional. Use "amenities" as array or "amenities_json" as JSON string.
*/
module.exports = router;
