const express = require("express");
const { QueryTypes } = require("sequelize");
const sequelize = require("../db");

const router = express.Router();

/**
 * GET /escort-service/service-types
 *
 * Query params:
 * - category (string, required)
 *
 * Returns all active service types from globalgo_escort_service_type for the given category.
 */
router.get("/service-types", async (req, res) => {
  const { category } = req.query;

  if (!category) {
    return res.status(400).json({
      message: "Missing required query parameter: category",
    });
  }

  try {
    const rows = await sequelize.query(
      `
        SELECT id, service_type_name, description, image
        FROM globalgo_escort_service_type
        WHERE category = ?
          AND status = 1
        ORDER BY service_type_name ASC
      `,
      {
        replacements: [category],
        type: QueryTypes.SELECT,
      }
    );

    return res.json({
      category,
      service_types: rows,
    });
  } catch (error) {
    console.error("Error fetching escort service types:", error);
    return res.status(500).json({
      message: "Failed to fetch service types",
      error: error.message,
    });
  }
});

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
 * GET /escort-service/filter
 *
 * Query params:
 * - service_type_id (int, preferred) — filters directly on globalgo_escort_services.service_type_id
 * - category        (string, optional)
 * - gender          (string, optional)
 * - min_price       (number, optional)
 * - max_price       (number, optional)
 *
 * Returns matching rows from globalgo_escort_services.
 */
router.get("/filter", async (req, res) => {
  const { service_type_id, category, gender, min_price, max_price } = req.query;

  try {
    const replacements = [];

    let sql = `
      SELECT
        id,
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
      WHERE STATUS = 1
    `;

    if (service_type_id != null && service_type_id !== "") {
      const id = parseInt(String(service_type_id), 10);
      if (!isNaN(id)) {
        sql += ` AND service_type_id = ?`;
        replacements.push(id);
      }
    }
    if (category && String(category).trim()) {
      sql += ` AND category = ?`;
      replacements.push(String(category).trim());
    }
    if (gender && String(gender).trim()) {
      sql += ` AND gender = ?`;
      replacements.push(String(gender).trim());
    }
    if (min_price != null && min_price !== "") {
      const n = parseFloat(String(min_price));
      if (!isNaN(n)) {
        sql += ` AND CAST(price AS DECIMAL(10,2)) >= ?`;
        replacements.push(n);
      }
    }
    if (max_price != null && max_price !== "") {
      const n = parseFloat(String(max_price));
      if (!isNaN(n)) {
        sql += ` AND CAST(price AS DECIMAL(10,2)) <= ?`;
        replacements.push(n);
      }
    }

    sql += ` ORDER BY person_name ASC, title ASC`;

    const persons = await sequelize.query(sql, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return res.json({
      message: "Filtered escort services fetched successfully",
      data: persons,
    });
  } catch (error) {
    console.error("Error fetching escort-service filter:", error);
    return res.status(500).json({
      message: "Failed to fetch escort services",
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
