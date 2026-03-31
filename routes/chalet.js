const express = require("express");
const {
  Chalet,
  ChaletBooking,
  ChaletAddonItem,
  ChaletSpecialPackage,
  ChaletAddonRestaurant,
  ChaletAddonRestaurantCategory,
  ChaletAddMenu,
  ChaletCategory
} = require("../models");
const auth = require("../middleware/auth");
const optionalAuth = auth.optionalAuth;
const router = express.Router();
const { Op } = require("sequelize");

// GET /chalets — health check for chalet API
router.get("/", (req, res) => {
  res.json({ message: "Chalets API", routes: ["GET /chalets/list", "GET /chalets/chalet-details/:id", "POST /chalets/booking", "GET /chalets/my-bookings"] });
});

// Exclude rate_night and price_per_day from API responses
const CHALET_ATTRIBUTES = { exclude: ["rate_night", "price_per_day"] };

function normalizeChaletDetail(row) {
  if (!row) return null;
  const r = row.get ? row.get({ plain: true }) : { ...row };
  const primaryImg = r.primary_image_url ?? r.image_url ?? "";
  r.image_url = primaryImg || null;
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
  r.image_url = primaryImg || null;
  return r;
}

// Haversine helpers: distance between two lat/long points in kilometers
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function distanceInKm(lat1, lon1, lat2, lon2) {
  const n1 = Number(lat1);
  const n2 = Number(lon1);
  const n3 = Number(lat2);
  const n4 = Number(lon2);

  if ([n1, n2, n3, n4].some((v) => Number.isNaN(v))) {
    return null;
  }

  const R = 6371; // km
  const dLat = toRad(n3 - n1);
  const dLon = toRad(n4 - n2);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(n1)) * Math.cos(toRad(n3)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
// Optional query:
// - lat, long, radius_km for distance-based filtering (default radius 100km)
const listChalets = async (req, res) => {
  try {
    const { lat: userLat, long: userLong, radius_km: radiusKm } = req.query;

    const list = await Chalet.findAll({
      attributes: CHALET_ATTRIBUTES,
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"]
      ]
    });

    const normalized = list.map(normalizeChaletListItem).filter(Boolean);

    let data = normalized;

    const hasUserLocation =
      userLat != null && userLat !== "" && userLong != null && userLong !== "";
    const parsedRadius =
      radiusKm != null && radiusKm !== "" ? Number(radiusKm) : 100;
    const radius =
      Number.isFinite(parsedRadius) && parsedRadius > 0 ? parsedRadius : 100;

    if (hasUserLocation) {
      const userLatNum = Number(userLat);
      const userLongNum = Number(userLong);

      if (!Number.isNaN(userLatNum) && !Number.isNaN(userLongNum)) {
        data = normalized
          .map((item) => {
            const cLat = item.lat;
            const cLong = item.long;
            const dist = distanceInKm(userLatNum, userLongNum, cLat, cLong);
            if (dist == null) return null;
            return { ...item, distance_km: dist };
          })
          .filter((c) => c && c.distance_km <= radius)
          .sort((a, b) => a.distance_km - b.distance_km);
      }
    }
    res.status(200).json({
      message: "Chalet list fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get chalet list", error: error.message });
  }
};
router.get("/list", listChalets);
router.get("/list/", listChalets);

// GET /chalets/filter-chalets
// Filters:
// - lat, long, radius_km: location radius filter (km)
// - min_price, max_price: numeric range on price_per_night
// - min_guests, max_guests: range on max_guests
// - min_bedrooms, max_bedrooms: range on bedrooms
// - min_bathrooms, max_bathrooms: range on bathrooms
// - amenities: comma-separated list matched against amenities_json (LIKE)
router.get("/filter-chalets", async (req, res) => {
  try {
    const {
      lat: userLat,
      long: userLong,
      radius_km: radiusKm,
      min_price,
      max_price,
      min_guests,
      max_guests,
      min_bedrooms,
      max_bedrooms,
      min_bathrooms,
      max_bathrooms,
      amenities
    } = req.query;

    const where = {};
    const andConditions = [];

    // Price range
    if (min_price != null || max_price != null) {
      where.price_per_night = {};
      if (min_price != null && String(min_price).trim() !== "") {
        where.price_per_night[Op.gte] = Number(min_price);
      }
      if (max_price != null && String(max_price).trim() !== "") {
        where.price_per_night[Op.lte] = Number(max_price);
      }
    }

    // Guests
    if (min_guests != null || max_guests != null) {
      where.max_guests = {};
      if (min_guests != null && String(min_guests).trim() !== "") {
        where.max_guests[Op.gte] = Number(min_guests);
      }
      if (max_guests != null && String(max_guests).trim() !== "") {
        where.max_guests[Op.lte] = Number(max_guests);
      }
    }

    // Bedrooms
    if (min_bedrooms != null || max_bedrooms != null) {
      where.bedrooms = {};
      if (min_bedrooms != null && String(min_bedrooms).trim() !== "") {
        where.bedrooms[Op.gte] = Number(min_bedrooms);
      }
      if (max_bedrooms != null && String(max_bedrooms).trim() !== "") {
        where.bedrooms[Op.lte] = Number(max_bedrooms);
      }
    }

    // Bathrooms
    if (min_bathrooms != null || max_bathrooms != null) {
      where.bathrooms = {};
      if (min_bathrooms != null && String(min_bathrooms).trim() !== "") {
        where.bathrooms[Op.gte] = Number(min_bathrooms);
      }
      if (max_bathrooms != null && String(max_bathrooms).trim() !== "") {
        where.bathrooms[Op.lte] = Number(max_bathrooms);
      }
    }

    // Amenities filter on amenities_json
    if (amenities != null && String(amenities).trim() !== "") {
      const amenityList = String(amenities)
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      if (amenityList.length > 0) {
        for (const amenity of amenityList) {
          andConditions.push({
            amenities_json: {
              [Op.like]: `%${amenity}%`
            }
          });
        }
      }
    }

    const finalWhere =
      andConditions.length > 0
        ? {
            ...where,
            [Op.and]: andConditions
          }
        : where;

    const list = await Chalet.findAll({
      attributes: CHALET_ATTRIBUTES,
      where: Object.keys(finalWhere).length ? finalWhere : undefined,
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"]
      ]
    });

    const normalized = list.map(normalizeChaletListItem).filter(Boolean);

    let data = normalized;

    const hasUserLocation =
      userLat != null && userLat !== "" && userLong != null && userLong !== "";
    const parsedRadius =
      radiusKm != null && radiusKm !== "" ? Number(radiusKm) : 100;
    const radius =
      Number.isFinite(parsedRadius) && parsedRadius > 0 ? parsedRadius : 100;

    if (hasUserLocation) {
      const userLatNum = Number(userLat);
      const userLongNum = Number(userLong);

      if (!Number.isNaN(userLatNum) && !Number.isNaN(userLongNum)) {
        data = normalized
          .map((item) => {
            const cLat = item.lat;
            const cLong = item.long;
            const dist = distanceInKm(userLatNum, userLongNum, cLat, cLong);
            if (dist == null) return null;
            return { ...item, distance_km: dist };
          })
          .filter((c) => c && c.distance_km <= radius)
          .sort((a, b) => a.distance_km - b.distance_km);
      }
    }

    res.status(200).json({
      message: "Filtered chalet list fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get filtered chalet list",
      error: error.message
    });
  }
});

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

function normalizeDateInput(val) {
  if (val == null) return null;
  if (typeof val === "string") {
    const s = val.trim();
    if (!s) return null;
    // Already ISO-like YYYY-MM-DD → accept as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return s;
    }
    // Try D/M/Y or D-M-Y formats
    const dmy = parseDateDMY(s);
    if (dmy) return dmy;
    return s;
  }
  return null;
}

function parseAmount(val) {
  if (val == null) return null;
  if (typeof val === "number" && !isNaN(val)) return val;
  const s = String(val).trim().replace(/[^\d.]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function normalizeTimeHHmm(val) {
  if (val == null) return null;
  const s = String(val).trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  const pad2 = (n) => String(n).padStart(2, "0");
  return `${pad2(hh)}:${pad2(mm)}`;
}

function buildNotesWithTimes(notes, checkInTime, checkOutTime) {
  const inT = normalizeTimeHHmm(checkInTime);
  const outT = normalizeTimeHHmm(checkOutTime);
  const prefixParts = [];
  if (inT) prefixParts.push(`__check_in_time=${inT}`);
  if (outT) prefixParts.push(`__check_out_time=${outT}`);
  const prefix = prefixParts.length ? `${prefixParts.join(";")};` : "";
  const userNotes = notes != null && String(notes).trim() !== "" ? String(notes).trim() : "";
  if (!prefix) return userNotes || null;
  if (!userNotes) return prefix;
  return `${prefix}\n${userNotes}`;
}

// POST /chalets/booking — create a chalet booking (optional auth: fills customer_id if logged in)
router.post("/booking", optionalAuth, async (req, res) => {
  try {
    const {
      chalet_id,
      customer_id: bodyCustomerId,
      check_in_date,
      check_in_time,
      check_out_date,
      check_out_time,
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

    const checkInStr = normalizeDateInput(check_in_date);
    const checkOutStr = normalizeDateInput(check_out_date);
    const amountNum = parseAmount(total_amount);
    const inTime = normalizeTimeHHmm(check_in_time);
    const outTime = normalizeTimeHHmm(check_out_time);
    const finalNotes = buildNotesWithTimes(notes, inTime, outTime);

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
      notes: finalNotes
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

// Fetch chalet addon items from allora_chalet_addon table (optional query: status=ACTIVE|INACTIVE)
router.get("/addon-items", async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && ["ACTIVE", "INACTIVE"].includes(String(status).toUpperCase())) {
      where.STATUS = String(status).toUpperCase();
    }

    const rows = await ChaletAddonItem.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [["addon_package_name", "ASC"]],
      raw: true
    });

    const data = rows.map((r) => ({
      ...r,
      addon_image: r.addon_image || null
    }));

    res.status(200).json({
      message: "Chalet addon items fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get chalet addon items",
      error: error.message
    });
  }
});

// Fetch chalet special packages from allora_special_packages table (optional query: status=ACTIVE|INACTIVE)
router.get("/special-packages", async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && ["ACTIVE", "INACTIVE"].includes(String(status).toUpperCase())) {
      where.STATUS = String(status).toUpperCase();
    }

    const rows = await ChaletSpecialPackage.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [["package_name", "ASC"]],
      raw: true
    });

    const data = rows.map((r) => ({
      ...r,
      package_images: r.package_images || null
    }));

    res.status(200).json({
      message: "Chalet special packages fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get chalet special packages",
      error: error.message
    });
  }
});

// Fetch single chalet special package by ID
// GET /chalets/special-packages/:id
router.get("/special-packages/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid package id" });
    }

    const row = await ChaletSpecialPackage.findByPk(id, { raw: true });
    if (!row) {
      return res.status(404).json({ message: "Chalet special package not found" });
    }

    const data = {
      ...row,
      package_images: row.package_images || null
    };

    res.status(200).json({
      message: "Chalet special package fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get chalet special package",
      error: error.message
    });
  }
});

// Fetch chalet addon restaurants from allora_chalet_addon_restaurants table
router.get("/addon-restaurants", async (req, res) => {
  try {
    const rows = await ChaletAddonRestaurant.findAll({
      order: [["restaurant_name", "ASC"]],
      raw: true
    });

    const parseJson = (val) => {
      if (val == null) return val;
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch (_) {
          return val;
        }
      }
      return val;
    };

    const data = rows.map((r) => {
      const images = parseJson(r.images);
      return {
        ...r,
        images: Array.isArray(images) ? images : images,
        image_url: Array.isArray(images) && images[0] ? images[0] : (r.images || null)
      };
    });

    res.status(200).json({
      message: "Chalet addon restaurants fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get chalet addon restaurants",
      error: error.message
    });
  }
});

// Fetch chalet addon restaurant categories from allora_chalet_addon_restaurant_category table
router.get("/addon-restaurants-category", async (req, res) => {
  try {
    const rows = await ChaletAddonRestaurantCategory.findAll({
      order: [["category_name", "ASC"]],
      raw: true
    });

    res.status(200).json({
      message: "Chalet addon restaurant categories fetched successfully",
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get chalet addon restaurant categories",
      error: error.message
    });
  }
});

// Fetch chalet addon restaurants with category names
// (join allora_chalet_addon_restaurants + allora_chalet_addon_restaurant_category)
router.get("/addon-restaurants-with-categories", async (req, res) => {
  try {
    const restaurants = await ChaletAddonRestaurant.findAll({
      order: [["restaurant_name", "ASC"]],
      raw: true
    });
    const categories = await ChaletAddonRestaurantCategory.findAll({
      raw: true
    });

    const parseJson = (val) => {
      if (val == null) return val;
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch (_) {
          if (String(val).includes(",")) {
            return String(val).split(",").map((s) => s.trim()).filter(Boolean);
          }
          return val;
        }
      }
      return val;
    };

    const catByRestaurant = {};
    for (const c of categories) {
      const rid = c.restaurant_id;
      if (rid == null) continue;
      const key = String(rid);
      if (!catByRestaurant[key]) catByRestaurant[key] = [];
      const name = (c.category_name || "").trim();
      if (name && !catByRestaurant[key].includes(name)) {
        catByRestaurant[key].push(name);
      }
    }

    const data = restaurants.map((r) => {
      const images = parseJson(r.images);
      const catList = catByRestaurant[String(r.id)] || [];
      return {
        ...r,
        images: Array.isArray(images) ? images : images,
        image_url: Array.isArray(images) && images[0] ? images[0] : (r.images || null),
        categories: catList
      };
    });

    res.status(200).json({
      message: "Chalet addon restaurants with categories fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get chalet addon restaurants with categories",
      error: error.message
    });
  }
});

// Fetch chalet restaurant menu items by restaurant_id (allora_chalet_add_menu)
// GET /chalets/addon-restaurant-items?restaurant_id=1
router.get("/addon-restaurant-items", async (req, res) => {
  try {
    const { restaurant_id: restaurantId } = req.query;

    if (!restaurantId || String(restaurantId).trim() === "") {
      return res.status(400).json({
        message: "restaurant_id query param is required"
      });
    }

    const items = await ChaletAddMenu.findAll({
      where: { restaurant_id: Number(restaurantId) },
      order: [["item_name", "ASC"]],
      raw: true
    });

    const parseImages = (val) => {
      if (val == null || val === "") return [];
      if (typeof val === "string") {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [val.trim()];
        } catch (_) {
          if (String(val).includes(",")) {
            return String(val).split(",").map((s) => s.trim()).filter(Boolean);
          }
          return val.trim() ? [val.trim()] : [];
        }
      }
      return [];
    };

    const data = items.map((r) => {
      const images = parseImages(r.images);
      const imageUrl = images[0] || null;
      return {
        id: r.id,
        name: r.item_name,
        item_name: r.item_name,
        description: r.description || "",
        price: String(r.price ?? "0"),
        unit: r.currency || "KD",
        currency: r.currency || "KD",
        images,
        image_url: imageUrl
      };
    });

    res.status(200).json({
      message: "Chalet restaurant items fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get chalet restaurant items",
      error: error.message
    });
  }
});

// GET /chalets/categories — list active chalet categories (allora_chalet_category)
router.get("/categories", async (req, res) => {
  try {
    const rows = await ChaletCategory.findAll({
      where: { status: 1 },
      order: [["id", "ASC"]],
      raw: true
    });
    res.status(200).json({
      message: "Chalet categories fetched successfully",
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get chalet categories",
      error: error.message
    });
  }
});

// GET /chalets/by-category/:categoryId — list chalets filtered by category_id
router.get("/by-category/:categoryId", async (req, res) => {
  try {
    const categoryId = parseInt(req.params.categoryId, 10);
    if (isNaN(categoryId)) {
      return res.status(400).json({ message: "Invalid categoryId" });
    }
    const list = await Chalet.findAll({
      attributes: CHALET_ATTRIBUTES,
      where: { category_id: categoryId },
      order: [["created_at", "DESC"], ["id", "DESC"]]
    });
    const data = list.map(normalizeChaletListItem).filter(Boolean);
    res.status(200).json({
      message: "Chalets by category fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get chalets by category",
      error: error.message
    });
  }
});

module.exports = router;
