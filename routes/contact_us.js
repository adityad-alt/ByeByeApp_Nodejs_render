const express = require("express");
const { BYEFeedback } = require("../models");

const router = express.Router();

// POST /contact-us/feedback
// Stores a feedback entry in BYE_feedback table.
router.post("/feedback", async (req, res) => {
  try {
    const { name, phone_number, email_id, feedback } = req.body || {};

    if (!name || !phone_number || !email_id || !feedback) {
      return res.status(400).json({
        message: "Missing required fields",
        error: "name, phone_number, email_id and feedback are all required"
      });
    }

    const record = await BYEFeedback.create({
      name,
      phone_number,
      email_id,
      feedback
    });

    return res.status(201).json({
      message: "Feedback submitted successfully",
      data: {
        id: record.id,
        name: record.name,
        phone_number: record.phone_number,
        email_id: record.email_id,
        feedback: record.feedback,
        created_at: record.created_at
      }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to submit feedback",
      error: error.message
    });
  }
});

module.exports = router;

