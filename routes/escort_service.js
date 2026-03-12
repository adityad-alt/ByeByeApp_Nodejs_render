const express = require("express");
const { QueryTypes } = require("sequelize");
const sequelize = require("../db");

const router = express.Router();

/**
 * GET /escort-service/categories
 *
 * Query params:
 * - service_type_name (string, required)
 *
 * Returns distinct categories for the given service type.
 */
router.get("/categories", async (req, res) => {
  const { service_type_name } = req.query;

  if (!service_type_name) {
    return res.status(400).json({
      message: "Missing required query parameter: service_type_name",
    });
  }

  try {
    // 1) Find the service type id from globalgo_escort_service_type
    const serviceTypeRows = await sequelize.query(
      `
        SELECT id
        FROM globalgo_escort_service_type
        WHERE service_type_name = ?
          AND status = 1
        LIMIT 1
      `,
      {
        replacements: [service_type_name],
        type: QueryTypes.SELECT,
      }
    );

    if (serviceTypeRows.length === 0) {
      return res.status(404).json({
        message: "Service type not found or inactive",
      });
    }

    const serviceTypeId = serviceTypeRows[0].id;

    // 2) Get distinct categories from globalgo_escort_services
    const categoryRows = await sequelize.query(
      `
        SELECT DISTINCT category
        FROM globalgo_escort_services
        WHERE service_type_id = ?
          AND STATUS = 1
          AND (category IS NOT NULL AND category <> '')
        ORDER BY category ASC
      `,
      {
        replacements: [serviceTypeId],
        type: QueryTypes.SELECT,
      }
    );

    const categories = categoryRows.map((row) => row.category);

    return res.json({
      service_type_name,
      service_type_id: serviceTypeId,
      categories,
    });
  } catch (error) {
    console.error("Error fetching escort-service categories:", error);
    return res.status(500).json({
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
});

/**
 * GET /escort-service/persons
 *
 * Query params:
 * - service_type_name (string, required)
 * - category (string, required)
 *
 * Returns list of persons/services for a given service type and category.
 */
router.get("/persons", async (req, res) => {
  const { service_type_name, category } = req.query;

  if (!service_type_name || !category) {
    return res.status(400).json({
      message:
        "Missing required query parameters: service_type_name and category",
    });
  }

  try {
    // 1) Find the service type id
    const serviceTypeRows = await sequelize.query(
      `
        SELECT id
        FROM globalgo_escort_service_type
        WHERE service_type_name = ?
          AND status = 1
        LIMIT 1
      `,
      {
        replacements: [service_type_name],
        type: QueryTypes.SELECT,
      }
    );

    if (serviceTypeRows.length === 0) {
      return res.status(404).json({
        message: "Service type not found or inactive",
      });
    }

    const serviceTypeId = serviceTypeRows[0].id;

    // 2) Get all persons/services for that type + category
    const persons = await sequelize.query(
      `
        SELECT
          id,
          service_type_name,
          service_type_id,
          category,
          title,
          person_name,
          person_contact,
          gender,
          date_time,
          guards,
          price,
          available,
          notes,
          SCHEDULE,
          hours_per_day,
          car_model,
          plate,
          driver_name,
          driver_contact,
          profile_url,
          extra,
          STATUS,
          created_at,
          updated_at
        FROM globalgo_escort_services
        WHERE service_type_id = ?
          AND category = ?
          AND STATUS = 1
        ORDER BY person_name ASC, title ASC
      `,
      {
        replacements: [serviceTypeId, category],
        type: QueryTypes.SELECT,
      }
    );

    return res.json({
      service_type_name,
      service_type_id: serviceTypeId,
      category,
      persons,
    });
  } catch (error) {
    console.error("Error fetching escort-service persons:", error);
    return res.status(500).json({
      message: "Failed to fetch persons",
      error: error.message,
    });
  }
});

module.exports = router;
