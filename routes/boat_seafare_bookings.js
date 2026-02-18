const express = require("express");
const { SeafarerTransaction } = require("../models");

const router = express.Router();

function generateCode(prefix) {
  const ts = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${ts}-${r}`;
}

// POST /boat-seafare-bookings
// Body (similar to /seafarers/transaction):
// {
//   customer_name,
//   customer_email,
//   customer_type: 'individual'|'corporate',
//   amount,
//   payment_method: 'card'|'bank_transfer'|'cash'|'wallet',
//   seafarer_id,
//   order_code?
// }
router.post("/", async (req, res) => {
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
    if (Number.isNaN(numAmount) || numAmount <= 0) {
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

    const tx = await SeafarerTransaction.create({
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

    const row = tx.get ? tx.get({ plain: true }) : tx;

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

// GET /boat-seafare-bookings
// Query:
//   ?id=           -> single transaction by id
//   ?customer_email=   -> filter by customer_email (for \"my seafarers\" screen)
//   ?seafarer_id=      -> optional filter by seafarer
router.get("/", async (req, res) => {
  try {
    const { id, customer_email, seafarer_id } = req.query;

    if (id) {
      const tx = await SeafarerTransaction.findOne({
        where: { id: Number(id) || id }
      });
      if (!tx) {
        return res.status(404).json({ message: "Seafarer transaction not found" });
      }
      const row = tx.get ? tx.get({ plain: true }) : tx;
      return res.status(200).json({
        message: "Seafarer transaction fetched successfully",
        data: row
      });
    }

    const where = {};
    if (customer_email && String(customer_email).trim() !== "") {
      where.customer_email = String(customer_email).trim();
    }
    if (seafarer_id != null && seafarer_id !== "") {
      where.seafarer_id = Number(seafarer_id) || seafarer_id;
    }

    const list = await SeafarerTransaction.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [["transaction_date", "DESC"], ["created_at", "DESC"]],
      raw: true
    });

    res.status(200).json({
      message: "Seafarer transactions fetched successfully",
      data: list
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch seafarer transactions",
      error: error.message
    });
  }
});

module.exports = router;

