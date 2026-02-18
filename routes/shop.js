const express = require("express");
const { Op } = require("sequelize");
const { AppShop, ShopOrder, ShopOrderItem } = require("../models");
const sequelize = require("../db");

const router = express.Router();

// Optional: base URL for image URLs (if stored as paths)
const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || "";

function toFullImageUrl(path) {
  if (!path || typeof path !== "string") return path || null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (!IMAGE_BASE_URL) return trimmed;
  const base = IMAGE_BASE_URL.endsWith("/") ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
  const p = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${p}`;
}

function formatItem(row) {
  if (!row) return null;
  const r = row.get ? row.get({ plain: true }) : { ...row };
  return {
    id: r.id,
    name: r.name,
    description: r.description || null,
    price: parseFloat(r.price),
    imageUrl: toFullImageUrl(r.image_url) || r.image_url,
    category_name: r.category_name
  };
}

/**
 * GET /shop/categories
 * Returns unique categories from app_shop (derived from items).
 * Response: { message, data: [ { id, name } ] }
 * id is 1-based index for use with GET /shop/items?category_id=1
 */
router.get("/categories", async (req, res) => {
  try {
    const list = await sequelize.query(
      `SELECT DISTINCT category_name FROM app_shop WHERE category_name IS NOT NULL AND category_name != '' ORDER BY category_name ASC`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const rows = Array.isArray(list) ? list : [];
    const data = rows.map((row, index) => ({
      id: index + 1,
      name: row.category_name
    }));
    res.status(200).json({
      message: "Categories fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch categories",
      error: error.message
    });
  }
});

/**
 * GET /shop/items/:id
 * Single item by id + related products (same category, excluding this id).
 * Response: { message, data: { item, relatedProducts } }
 */
router.get("/items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id < 1) {
      return res.status(400).json({ message: "Invalid item id" });
    }
    const item = await AppShop.findByPk(id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    const categoryName = item.category_name;
    const related = await AppShop.findAll({
      where: {
        category_name: categoryName,
        id: { [Op.ne]: id }
      },
      limit: 8,
      order: [["id", "ASC"]]
    });
    res.status(200).json({
      message: "Item details fetched successfully",
      data: {
        item: formatItem(item),
        relatedProducts: related.map(formatItem).filter(Boolean)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch item details",
      error: error.message
    });
  }
});

/**
 * GET /shop/items
 * Query: category_name (string) OR category_id (number, 1-based index from /shop/categories).
 * If neither provided, returns all items.
 * Response: { message, data: [ { id, name, description, price, imageUrl, category_name } ] }
 */
router.get("/items", async (req, res) => {
  try {
    const { category_name: categoryName, category_id: categoryId } = req.query;
    let categoryNameFilter = null;

    if (categoryName && String(categoryName).trim()) {
      categoryNameFilter = String(categoryName).trim();
    } else if (categoryId != null && categoryId !== "") {
      const id = parseInt(categoryId, 10);
      if (!Number.isNaN(id) && id >= 1) {
        const catList = await sequelize.query(
          `SELECT DISTINCT category_name FROM app_shop WHERE category_name IS NOT NULL AND category_name != '' ORDER BY category_name ASC`,
          { type: sequelize.QueryTypes.SELECT }
        );
        const catRows = Array.isArray(catList) ? catList : [];
        const index = id - 1;
        if (index < catRows.length) {
          categoryNameFilter = catRows[index].category_name;
        }
      }
    }

    const where = categoryNameFilter ? { category_name: categoryNameFilter } : {};
    const items = await AppShop.findAll({
      where,
      order: [["id", "ASC"]]
    });

    res.status(200).json({
      message: "Items fetched successfully",
      data: items.map(formatItem).filter(Boolean)
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch items",
      error: error.message
    });
  }
});

/**
 * POST /shop/items
 * Body: { name, description?, price, image_url?, category_name }
 * Creates a new shop item.
 */
router.post("/items", async (req, res) => {
  try {
    const { name, description, price, image_url, category_name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "name is required" });
    }
    if (price == null || (typeof price !== "number" && typeof price !== "string")) {
      return res.status(400).json({ message: "price is required" });
    }
    const priceNum = typeof price === "string" ? parseFloat(price) : Number(price);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      return res.status(400).json({ message: "price must be a valid non-negative number" });
    }
    if (!category_name || typeof category_name !== "string" || !category_name.trim()) {
      return res.status(400).json({ message: "category_name is required" });
    }
    const item = await AppShop.create({
      name: name.trim(),
      description: description != null ? String(description).trim() || null : null,
      price: priceNum,
      image_url: image_url != null ? String(image_url).trim() || null : null,
      category_name: category_name.trim()
    });
    res.status(201).json({
      message: "Item created successfully",
      data: formatItem(item)
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create item",
      error: error.message
    });
  }
});

// ─── Shop orders (shop_order + shop_order_item) ───────────────────────────

function formatOrderItem(row) {
  if (!row) return null;
  const r = row.get ? row.get({ plain: true }) : { ...row };
  return {
    id: r.id,
    order_id: r.order_id,
    item_id: r.item_id,
    product_name: r.product_name,
    quantity: r.quantity,
    unit_price: parseFloat(r.unit_price),
    line_total: parseFloat(r.unit_price) * (r.quantity || 0)
  };
}

function formatOrder(row) {
  if (!row) return null;
  const r = row.get ? row.get({ plain: true }) : { ...row };
  return {
    id: r.id,
    user_id: r.user_id,
    total: parseFloat(r.total),
    status: r.status,
    created_at: r.created_at,
    items: (r.ShopOrderItems || []).map(formatOrderItem).filter(Boolean)
  };
}

/**
 * POST /shop/orders
 * Body: { items: [ { item_id, quantity } ] }
 * Creates a shop order and order line items. Looks up price from app_shop.
 */
router.post("/orders", async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items array is required and must not be empty" });
    }

    let total = 0;
    const lineItems = [];

    for (const row of items) {
      const itemId = row.item_id != null ? parseInt(row.item_id, 10) : null;
      const quantity = row.quantity != null ? parseInt(row.quantity, 10) : 0;
      if (!itemId || quantity < 1) continue;

      const product = await AppShop.findByPk(itemId);
      if (!product) continue;

      const unitPrice = parseFloat(product.price);
      const lineTotal = unitPrice * quantity;
      total += lineTotal;
      lineItems.push({
        item_id: itemId,
        product_name: product.name,
        quantity,
        unit_price: unitPrice
      });
    }

    if (lineItems.length === 0) {
      return res.status(400).json({ message: "No valid items (item_id and quantity required)" });
    }

    const order = await ShopOrder.create({
      user_id: req.body.user_id != null ? parseInt(req.body.user_id, 10) : null,
      total: Math.round(total * 1000) / 1000,
      status: "placed"
    });

    for (const line of lineItems) {
      await ShopOrderItem.create({
        order_id: order.id,
        item_id: line.item_id,
        product_name: line.product_name,
        quantity: line.quantity,
        unit_price: line.unit_price
      });
    }

    const orderWithItems = await ShopOrder.findByPk(order.id, {
      include: [{ model: ShopOrderItem, as: "ShopOrderItems" }]
    });

    res.status(201).json({
      message: "Order placed successfully",
      data: formatOrder(orderWithItems)
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create order",
      error: error.message
    });
  }
});

/**
 * GET /shop/orders
 * Optional query: user_id. Returns list of orders (without items).
 */
router.get("/orders", async (req, res) => {
  try {
    const { user_id: userId } = req.query;
    const where = userId != null && userId !== "" ? { user_id: parseInt(userId, 10) } : {};
    const orders = await ShopOrder.findAll({
      where,
      order: [["id", "DESC"]],
      attributes: ["id", "user_id", "total", "status", "created_at"]
    });
    const data = orders.map((o) => {
      const r = o.get ? o.get({ plain: true }) : { ...o };
      return {
        id: r.id,
        user_id: r.user_id,
        total: parseFloat(r.total),
        status: r.status,
        created_at: r.created_at
      };
    });
    res.status(200).json({
      message: "Orders fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message
    });
  }
});

/**
 * GET /shop/orders/:id
 * Single order with line items.
 */
router.get("/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id) || id < 1) {
      return res.status(400).json({ message: "Invalid order id" });
    }
    const order = await ShopOrder.findByPk(id, {
      include: [{ model: ShopOrderItem, as: "ShopOrderItems" }]
    });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({
      message: "Order details fetched successfully",
      data: formatOrder(order)
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch order details",
      error: error.message
    });
  }
});

module.exports = router;
