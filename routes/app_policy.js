const express = require("express");
const Policy = require("../models/Policy");

const router = express.Router();

// GET /app-policies?policy_type=terms|refund|privacy
// Returns the latest active policy for the given type.
router.get("/", async (req, res) => {
  try {
    const { policy_type } = req.query;

    if (!policy_type || !["terms", "refund", "privacy"].includes(String(policy_type))) {
      return res.status(400).json({
        message: "Invalid or missing policy_type. Allowed: terms, refund, privacy"
      });
    }

    const policy = await Policy.findOne({
      attributes: ["id", "policy_type", "title", "description", "status", "created_at", "updated_at"],
      where: {
        policy_type: policy_type,
        status: 1
      },
      order: [["created_at", "DESC"]],
      raw: true
    });

    if (!policy) {
      return res.status(404).json({
        message: "Policy not found",
        data: null
      });
    }

    res.status(200).json({
      message: "Policy fetched successfully",
      data: policy
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch policy",
      error: error.message
    });
  }
});

module.exports = router;
