const express = require("express");
const { Seafarer, SeafarerTransaction } = require("../models");

const router = express.Router();

function generateCode(prefix) {
  const ts = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${r}`;
}

const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || "https://alltestserver.space/BYEBYE";

function toFullImageUrl(path) {
  if (!path || typeof path !== "string") return "";
  const trimmed = path.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const base = IMAGE_BASE_URL.endsWith("/") ? IMAGE_BASE_URL.slice(0, -1) : IMAGE_BASE_URL;
  const p = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${p}`;
}

function normalizeSeafarer(seafarer) {
  const row = seafarer.get ? seafarer.get({ plain: true }) : seafarer;
  return {
    ...row,
    profile_photo_url: toFullImageUrl(row.profile_photo_url),
    documents_image: toFullImageUrl(row.documents_image)
  };
}

// Get seafarers list (all or by status, optional id for single)
router.get("/list", async (req, res) => {
  try {
    const { id, status } = req.query;
    const where = {};

    if (status && ["active", "inactive", "blocked"].includes(String(status).toLowerCase())) {
      where.STATUS = String(status).toLowerCase();
    }

    if (id) {
      const seafarer = await Seafarer.findOne({
        where: { id }
      });
      if (!seafarer) {
        return res.status(404).json({ message: "Seafarer not found" });
      }
      return res.status(200).json({
        message: "Seafarer fetched successfully",
        data: normalizeSeafarer(seafarer)
      });
    }

    const seafarers = await Seafarer.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [["full_name", "ASC"]]
    });

    res.status(200).json({
      message: "Seafarers list fetched successfully",
      data: seafarers.map(normalizeSeafarer)
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get seafarers list",
      error: error.message
    });
  }
});

// Create seafarer transaction (when payment is done)
router.post("/transaction", async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_type,
      amount,
      payment_method,
      seafarer_id,
      order_code: clientOrderCode
    } = req.body;

    const numAmount = amount != null ? Number(amount) : 0;
    if (numAmount <= 0) {
      return res.status(400).json({
        message: "Invalid amount",
        error: "amount must be a positive number"
      });
    }

    const allowedPaymentMethods = ["card", "bank_transfer", "cash", "wallet"];
    const method = String(payment_method || "card").toLowerCase();
    if (!allowedPaymentMethods.includes(method)) {
      return res.status(400).json({
        message: "Invalid payment method",
        error: `payment_method must be one of: ${allowedPaymentMethods.join(", ")}`
      });
    }

    const transaction_code = generateCode("SFTXN");
    const order_code = clientOrderCode || generateCode("SFORD");
    const transaction_date = new Date();

    const transaction = await SeafarerTransaction.create({
      transaction_code,
      order_code,
      customer_name: customer_name || null,
      customer_email: customer_email || null,
      customer_type: customer_type === "corporate" ? "corporate" : "individual",
      amount: numAmount,
      payment_status: "paid",
      payment_method: method,
      transaction_date,
      STATUS: "completed",
      seafarer_id: seafarer_id != null ? Number(seafarer_id) : null
    });

    const row = transaction.get ? transaction.get({ plain: true }) : transaction;
    res.status(201).json({
      message: "Seafarer transaction created successfully",
      data: row
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create seafarer transaction",
      error: error.message
    });
  }
});

module.exports = router;
