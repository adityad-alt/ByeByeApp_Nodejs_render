const express = require("express");
const jwt = require("jsonwebtoken");
const sequelize = require("../db");

const router = express.Router();

const JWT_SECRET =
  process.env.JWT_SECRET || "e1d9ccb2b1f06ec0ed31b95f7d344d9ebbe7aa47da26af9652347654c0837bc5";

function getTokenFromRequest(req) {
  const bodyToken = req.body?.token;
  if (typeof bodyToken === "string" && bodyToken.trim()) return bodyToken.trim();

  const queryToken = req.query?.token;
  if (typeof queryToken === "string" && queryToken.trim()) return queryToken.trim();

  const authHeader = req.headers?.authorization;
  if (typeof authHeader === "string" && authHeader.trim()) {
    const [scheme, token] = authHeader.split(" ");
    if (scheme === "Bearer" && token) return token.trim();
    // Fallback: allow raw token in Authorization header
    return authHeader.trim();
  }

  return null;
}

function parseMaybeNumber(v) {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

router.post("/check", async (req, res) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const couponCodeRaw = req.body?.coupon_code ?? req.query?.coupon_code;
    const couponCode =
      typeof couponCodeRaw === "string" ? couponCodeRaw.trim() : "";

    if (!couponCode) {
      return res.status(400).json({ message: "coupon_code is required" });
    }

    const orderIdRaw = req.body?.order_id ?? req.query?.order_id;
    const orderId =
      orderIdRaw == null || orderIdRaw === "" ? null : Number(orderIdRaw);
    const orderTotal =
      parseMaybeNumber(req.body?.order_total) ??
      parseMaybeNumber(req.body?.total_amount) ??
      parseMaybeNumber(req.body?.total_amount) ??
      parseMaybeNumber(req.body?.total) ??
      parseMaybeNumber(req.body?.order_amount);

    const now = new Date();

    const result = await sequelize.transaction(async (t) => {
      const couponRows = await sequelize.query(
        `
        SELECT
          id,
          coupon_code,
          discount_type,
          discount_value,
          minimum_order_amount,
          maximum_discount_amount,
          usage_limit,
          used_count,
          start_date,
          end_date,
          status
        FROM coupons
        WHERE coupon_code = :coupon_code
          AND status = 1
          AND (start_date IS NULL OR start_date <= :now)
          AND (end_date IS NULL OR end_date >= :now)
        `,
        {
          replacements: {
            coupon_code: couponCode,
            now,
          },
          type: sequelize.QueryTypes.SELECT,
          transaction: t
        }
      );

      if (!Array.isArray(couponRows) || couponRows.length === 0) {
        return { available: false, message: "Coupon not available" };
      }

      const c = couponRows[0];
      const couponIdNum = Number(c.id);
      if (!Number.isFinite(couponIdNum)) {
        return { available: false, message: "Coupon not available" };
      }

      const usedCount = Number(c.used_count ?? 0);
      const usageLimit =
        c.usage_limit == null || c.usage_limit === "" ? null : Number(c.usage_limit);

      if (usageLimit != null && Number.isFinite(usageLimit) && usedCount >= usageLimit) {
        return { available: false, message: "Coupon not available" };
      }

      const minimumOrderAmount = Number(c.minimum_order_amount ?? 0);
      if (
        orderTotal != null &&
        Number.isFinite(orderTotal) &&
        orderTotal > 0 &&
        orderTotal < minimumOrderAmount
      ) {
        return {
          available: false,
          message:
            "This coupon requires a minimum order amount of " + minimumOrderAmount + " KWD",
          minimum_order_amount: minimumOrderAmount,
          order_total: orderTotal
        };
      }

      let discountAmount = 0;
      if (orderTotal != null && Number.isFinite(orderTotal) && orderTotal > 0) {
        const discountType = String(c.discount_type || "fixed");
        const discountValue = Number(c.discount_value ?? 0);
        const maximumDiscountAmount =
          c.maximum_discount_amount == null || c.maximum_discount_amount === ""
            ? null
            : Number(c.maximum_discount_amount);

        if (orderTotal >= minimumOrderAmount) {
          if (discountType === "percentage") {
            discountAmount = (orderTotal * discountValue) / 100;
          } else {
            // fixed
            discountAmount = discountValue;
          }

          if (maximumDiscountAmount != null && Number.isFinite(maximumDiscountAmount)) {
            discountAmount = Math.min(discountAmount, maximumDiscountAmount);
          }

          discountAmount = Math.min(discountAmount, orderTotal);
          discountAmount = Math.max(0, discountAmount);
        }
      }

      return {
        available: true,
        message: "Coupon applied successfully",
        data: {
          coupon_id: couponIdNum,
          coupon_code: c.coupon_code ?? couponCode,
          discount_type: c.discount_type ?? null,
          discount_value: c.discount_value ?? null,
          discount_amount: discountAmount
        }
      };
    });

    if (!result.available) {
      return res.status(200).json({
        message: result.message || "Coupon not available"
      });
    }

    return res.status(200).json({
      message: result.message,
      data: { ...result.data, available: true }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to validate coupon",
      error: error.message
    });
  }
});

router.post("/after-payment", async (req, res) => {
  try {
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ message: "Authorization token required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const couponCodeRaw = req.body?.coupon_code ?? req.query?.coupon_code;
    const couponCode =
      typeof couponCodeRaw === "string" ? couponCodeRaw.trim() : "";
    if (!couponCode) {
      return res.status(400).json({ message: "coupon_code is required" });
    }

    const orderIdRaw = req.body?.order_id ?? req.query?.order_id;
    if (orderIdRaw == null || orderIdRaw === "") {
      return res.status(400).json({ message: "order_id is required" });
    }
    const orderId = Number(orderIdRaw);
    if (!Number.isFinite(orderId)) {
      return res.status(400).json({ message: "order_id must be a valid number" });
    }

    const orderTotal =
      parseMaybeNumber(req.body?.order_total) ??
      parseMaybeNumber(req.body?.total_amount) ??
      parseMaybeNumber(req.body?.total_amount) ??
      parseMaybeNumber(req.body?.total) ??
      parseMaybeNumber(req.body?.order_amount);
    if (orderTotal == null || !Number.isFinite(orderTotal) || orderTotal <= 0) {
      return res.status(400).json({ message: "order_total must be provided and > 0" });
    }

    const result = await sequelize.transaction(async (t) => {
      const couponRows = await sequelize.query(
        `
        SELECT
          id,
          coupon_code,
          discount_type,
          discount_value,
          minimum_order_amount,
          maximum_discount_amount,
          usage_limit,
          used_count,
          start_date,
          end_date,
          status
        FROM coupons
        WHERE coupon_code = :coupon_code
          AND status = 1
          AND (start_date IS NULL OR start_date <= :now)
          AND (end_date IS NULL OR end_date >= :now)
        FOR UPDATE
        `,
        {
          replacements: {
            coupon_code: couponCode,
            now: new Date(),
          },
          type: sequelize.QueryTypes.SELECT,
          transaction: t
        }
      );

      if (!Array.isArray(couponRows) || couponRows.length === 0) {
        return { available: false, message: "Coupon not available" };
      }

      const c = couponRows[0];
      const couponIdNum = Number(c.id);
      if (!Number.isFinite(couponIdNum)) {
        return { available: false, message: "Coupon not available" };
      }

      const usedCount = Number(c.used_count ?? 0);
      const usageLimit =
        c.usage_limit == null || c.usage_limit === "" ? null : Number(c.usage_limit);

      if (usageLimit != null && Number.isFinite(usageLimit) && usedCount >= usageLimit) {
        return { available: false, message: "Coupon not available" };
      }

      const minimumOrderAmount = Number(c.minimum_order_amount ?? 0);
      if (orderTotal < minimumOrderAmount) {
        return {
          available: false,
          message:
            "This coupon requires a minimum order amount of " + minimumOrderAmount + " KWD",
          minimum_order_amount: minimumOrderAmount,
          order_total: orderTotal
        };
      }

      const existingUsedRows = await sequelize.query(
        `
        SELECT id, discount_amount
        FROM used_coupons
        WHERE order_id = :order_id
          AND coupon_id = :coupon_id
          AND user_id = :user_id
        LIMIT 1
        `,
        {
          replacements: {
            order_id: orderId,
            coupon_id: couponIdNum,
            user_id: Number(userId),
          },
          type: sequelize.QueryTypes.SELECT,
          transaction: t
        }
      );

      if (Array.isArray(existingUsedRows) && existingUsedRows.length > 0) {
        const existing = existingUsedRows[0];
        return {
          available: true,
          message: "Coupon usage already recorded",
          data: {
            coupon_id: couponIdNum,
            coupon_code: c.coupon_code ?? couponCode,
            discount_type: c.discount_type ?? null,
            discount_value: c.discount_value ?? null,
            discount_amount: Number(existing.discount_amount ?? 0),
          }
        };
      }

      let discountAmount = 0;
      if (orderTotal != null && Number.isFinite(orderTotal) && orderTotal > 0) {
        const discountType = String(c.discount_type || "fixed");
        const discountValue = Number(c.discount_value ?? 0);
        const maximumDiscountAmount =
          c.maximum_discount_amount == null || c.maximum_discount_amount === ""
            ? null
            : Number(c.maximum_discount_amount);

        if (orderTotal >= minimumOrderAmount) {
          if (discountType === "percentage") {
            discountAmount = (orderTotal * discountValue) / 100;
          } else {
            // fixed
            discountAmount = discountValue;
          }

          if (maximumDiscountAmount != null && Number.isFinite(maximumDiscountAmount)) {
            discountAmount = Math.min(discountAmount, maximumDiscountAmount);
          }

          discountAmount = Math.min(discountAmount, orderTotal);
          discountAmount = Math.max(0, discountAmount);
        }
      }

      await sequelize.query(
        `
        INSERT INTO used_coupons (
          coupon_id,
          user_id,
          order_id,
          coupon_code,
          discount_amount,
          used_at,
          created_at,
          updated_at
        )
        VALUES (
          :coupon_id,
          :user_id,
          :order_id,
          :coupon_code,
          :discount_amount,
          NOW(),
          NOW(),
          NOW()
        )
        `,
        {
          replacements: {
            coupon_id: couponIdNum,
            user_id: Number(userId),
            order_id: orderId,
            coupon_code: couponCode,
            discount_amount: discountAmount
          },
          transaction: t
        }
      );

      await sequelize.query(
        `
        UPDATE coupons
        SET used_count = used_count + 1,
            updated_at = NOW()
        WHERE id = :id
        `,
        {
          replacements: { id: couponIdNum },
          transaction: t
        }
      );

      return {
        available: true,
        message: "Coupon usage recorded successfully",
        data: {
          coupon_id: couponIdNum,
          coupon_code: c.coupon_code ?? couponCode,
          discount_type: c.discount_type ?? null,
          discount_value: c.discount_value ?? null,
          discount_amount: discountAmount
        }
      };
    });

    if (!result.available) {
      return res.status(200).json({
        message: result.message || "Coupon not available"
      });
    }

    return res.status(200).json({
      message: result.message,
      data: { ...result.data, available: true }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to confirm coupon usage",
      error: error.message
    });
  }
});

module.exports = router;

