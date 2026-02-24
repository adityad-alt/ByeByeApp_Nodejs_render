const express = require("express");
const { CateringOrder, CatererMenuItem, Caterer } = require("../models");
const auth = require("../middleware/auth");
const router = express.Router();

// ——— Caterer list & create (for Chalet / Catering Services UI) ———

/*
  POST /caterer - Create a caterer
  Sample body:
  {
    "name": "Aspen Valley Catering",
    "address": "8843 Katharine Junctions, South Eneida",
    "image_url": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400",
    "rating": "4.8"
  }
  All fields optional except you typically want at least "name".
*/
router.post("/", async (req, res) => {
  try {
    const { name, address, image_url, rating } = req.body;
    const caterer = await Caterer.create({
      name: name || null,
      address: address || null,
      image_url: image_url || null,
      rating: rating || null
    });
    res.status(201).json({
      message: "Caterer created successfully",
      data: caterer
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create caterer",
      error: error.message
    });
  }
});

// GET /caterer/list - List caterers (from caterers table; fallback: distinct from caterer_menu_items)
router.get("/list", async (req, res) => {
  try {
    let data = [];
    try {
      const list = await Caterer.findAll({
        order: [
          ["created_at", "DESC"],
          ["id", "DESC"]
        ],
        raw: true
      });
      if (list && list.length > 0) {
        data = list.map((r) => ({
          id: r.id,
          name: r.name || `Caterer ${r.id}`,
          address: r.address || "",
          image_url: r.image_url ?? null,
          rating: r.rating || "4.8"
        }));
      }
    } catch (_) {
      // caterers table may not exist yet
    }
    if (data.length === 0) {
      const items = await CatererMenuItem.findAll({
        attributes: ["caterer_id"],
        raw: true
      });
      const ids = [...new Set(items.map((i) => i.caterer_id).filter(Boolean))];
      data = ids
        .sort((a, b) => (a == null ? 0 : a) - (b == null ? 0 : b))
        .map((id) => ({
          id,
          name: `Caterer ${id}`,
          address: "",
          image_url: null,
          rating: "4.8"
        }));
    }
    res.status(200).json({
      message: "Caterer list fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch caterer list",
      error: error.message
    });
  }
});

// ——— Catering orders (per user) ———

// POST /caterer/orders - Create catering order (authenticated user)
router.post("/orders", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const {
      caterer_id,
      address_id,
      no_of_persons,
      status,
      subtotal,
      discount_amount,
      coupon_code,
      total,
      payment_method,
      payment_status,
      transaction_id,
      queries,
      items_ordered
    } = req.body;

    if (!caterer_id) {
      return res.status(400).json({ message: "caterer_id is required" });
    }

    const itemsOrderedStr =
      items_ordered == null
        ? null
        : typeof items_ordered === "string"
          ? items_ordered
          : JSON.stringify(items_ordered);

    const order = await CateringOrder.create({
      user_id: userId,
      caterer_id,
      address_id: address_id || null,
      no_of_persons: no_of_persons ?? null,
      status: status || "pending",
      subtotal: subtotal ?? null,
      discount_amount: discount_amount ?? null,
      coupon_code: coupon_code || null,
      total: total ?? null,
      payment_method: payment_method || null,
      payment_status: payment_status || "pending",
      transaction_id: transaction_id || null,
      queries: queries || null,
      items_ordered: itemsOrderedStr
    });

    res.status(201).json({
      message: "Catering order created successfully",
      data: order
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create catering order",
      error: error.message
    });
  }
});

// GET /caterer/orders - Get current user's catering orders
router.get("/orders", auth, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const orders = await CateringOrder.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      raw: true
    });

    const data = orders.map((o) => ({
      ...o,
      items_ordered:
        o.items_ordered != null
          ? (() => {
              try {
                return JSON.parse(o.items_ordered);
              } catch {
                return o.items_ordered;
              }
            })()
          : null
    }));

    res.status(200).json({
      message: "Catering orders fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch catering orders",
      error: error.message
    });
  }
});

// ——— Caterer menu items ———

// POST /caterer/menu-items - Create menu item
router.post("/menu-items", async (req, res) => {
  try {
    const {
      caterer_id,
      name,
      description,
      preparation_mins,
      price,
      image_url,
      sort_order
    } = req.body;

    if (!caterer_id) {
      return res.status(400).json({ message: "caterer_id is required" });
    }

    const item = await CatererMenuItem.create({
      caterer_id,
      name: name || null,
      description: description || null,
      preparation_mins: preparation_mins ?? null,
      price: price ?? null,
      image_url: image_url || null,
      sort_order: sort_order ?? null
    });

    res.status(201).json({
      message: "Menu item created successfully",
      data: item
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create menu item",
      error: error.message
    });
  }
});

// GET /caterer/menu-items - Get menu items (optional: ?caterer_id=)
router.get("/menu-items", async (req, res) => {
  try {
    const { caterer_id } = req.query;
    const where = caterer_id ? { caterer_id } : {};

    const items = await CatererMenuItem.findAll({
      where,
      order: [
        ["sort_order", "ASC"],
        ["id", "ASC"]
      ],
      raw: true
    });

    res.status(200).json({
      message: "Menu items fetched successfully",
      data: items
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch menu items",
      error: error.message
    });
  }
});

module.exports = router;
