const express = require("express");
const { SeafarerJob } = require("../models");

const router = express.Router();

function normalizeJob(row) {
  const job = row && row.get ? row.get({ plain: true }) : row;
  return { ...job };
}

// POST /seafare-jobs
// Body:
// {
//   full_name: string (required),
//   license_number?: string,
//   email?: string,
//   phone?: string,
//   specialty?: string,
//   experience_years?: number,
//   certifications?: string,
//   STATUS?: "pending" | "active" | "inactive"
// }
router.post("/", async (req, res) => {
  try {
    const {
      full_name,
      license_number,
      email,
      phone,
      specialty,
      experience_years,
      certifications,
      STATUS
    } = req.body || {};

    if (!full_name || String(full_name).trim() === "") {
      return res.status(400).json({
        message: "Validation error",
        error: "full_name is required"
      });
    }

    const expYears =
      experience_years != null && experience_years !== ""
        ? Number(experience_years)
        : null;

    if (expYears != null && Number.isNaN(expYears)) {
      return res.status(400).json({
        message: "Validation error",
        error: "experience_years must be a number"
      });
    }

    const statusValue = (STATUS || "pending").toString().toLowerCase();
    const allowedStatus = ["pending", "active", "inactive"];
    const finalStatus = allowedStatus.includes(statusValue)
      ? statusValue
      : "pending";

    const created = await SeafarerJob.create({
      full_name: String(full_name).trim(),
      license_number: license_number || null,
      email: email || null,
      phone: phone || null,
      specialty: specialty || null,
      experience_years: expYears,
      certifications: certifications || null,
      STATUS: finalStatus
    });

    res.status(201).json({
      message: "Seafarer job application created successfully",
      data: normalizeJob(created)
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create seafarer job application",
      error: error.message
    });
  }
});

module.exports = router;

