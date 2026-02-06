const express = require("express");
const { Boat, BoatCategory, BoatSubCategory, BoatAmenity } = require("../models");
const { Sequelize } = require("sequelize");

const router = express.Router();

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

// Normalize boat for API response: add name, image_url, facilities for backward compatibility with Flutter
function normalizeBoat(boat) {
  const row = boat.get ? boat.get({ plain: true }) : boat;
  const parseJson = (val) => {
    if (val == null) return val;
    if (typeof val === "string") {
      try {
        return JSON.parse(val);
      } catch (_) {
        return val;
      }
    }
    return val;
  };
  const rawAmenities = row.amenities;
  const parsed = parseJson(rawAmenities);
  const amenitiesList = Array.isArray(parsed)
    ? parsed.map((a) => (typeof a === "string" ? a : String(a)))
    : parsed && typeof parsed === "object"
      ? Object.values(parsed).map(String)
      : [];
  // primary_image_url can hold: single URL, JSON array ["url1","url2"], or comma-separated "url1,url2"
  const primaryImgRaw = row.primary_image_url ?? row.image_url ?? "";
  const parseImagesFromString = (val) => {
    if (!val || typeof val !== "string") return [];
    const trimmed = String(val).trim();
    if (!trimmed) return [];
    const parsed = parseJson(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.filter(Boolean).map(String);
    }
    if (trimmed.includes(",")) {
      return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [trimmed];
  };
  const galleryImages = parseImagesFromString(primaryImgRaw).map(toFullImageUrl).filter(Boolean);
  const primaryImg = galleryImages[0] ?? "";
  return {
    ...row,
    name: row.boat_name ?? row.name ?? "",
    image_url: primaryImg,
    gallery_images: galleryImages,
    amenities: amenitiesList,
    facilities: amenitiesList
  };
}

router.get("/all-boat-list", async (req, res) => {
  try {
    const { category, sub_category } = req.query;
    const where = {};

    if (category) {
      where.category_name = category;
    }
    if (sub_category) {
      where.sub_category_name = sub_category;
    }

    const boatList = await Boat.findAll({ where });
    res.status(200).json({
      message: "Boat list fetched successfully",
      data: boatList.map(normalizeBoat)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get boat list", error: error.message });
  }
});

router.get("/boat-details/:id", async (req, res) => {
  try {
    const boat = await Boat.findByPk(req.params.id);
    if (!boat) {
      return res.status(404).json({ message: "Boat not found" });
    }
    res.status(200).json({
      message: "Boat details fetched successfully",
      data: normalizeBoat(boat)
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get boat details", error: error.message });
  }
});

// Get subcategories list by category name (query: category)
router.get("/sub-category-list", async (req, res) => {
  try {
    const { category } = req.query;

    if (!category || String(category).trim() === "") {
      return res.status(400).json({
        message: "category query param is required"
      });
    }

    const subCategories = await BoatSubCategory.findAll({
      attributes: ["id", "category_name", "sub_category_name", "image", "status"],
      where: { category_name: String(category).trim() },
      order: [["sub_category_name", "ASC"]],
      raw: true
    });

    res.status(200).json({
      message: "Subcategory list fetched successfully",
      data: subCategories
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get subcategory list",
      error: error.message
    });
  }
});

// Get list of facilities (from boat_amenities table; optional query: status = active|inactive)
router.get("/facilities", async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && ["active", "inactive"].includes(String(status).toLowerCase())) {
      where.STATUS = String(status).toLowerCase();
    }

    const rows = await BoatAmenity.findAll({
      attributes: ["id", "NAME", "icon_image", "description", "STATUS"],
      where: Object.keys(where).length ? where : undefined,
      order: [["NAME", "ASC"]],
      raw: true
    });

    const facilities = rows.map((r) => ({
      id: r.id,
      name: r.NAME ?? "",
      icon_image: r.icon_image ?? null,
      description: r.description ?? null,
      STATUS: r.STATUS ?? null
    }));

    res.status(200).json({
      message: "Facilities list fetched successfully",
      data: facilities
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get facilities list",
      error: error.message
    });
  }
});

router.post("/add-boat", async (req, res) => {
  try {
    const {
      boat_name,
      vendor_name,
      category_name,
      sub_category_name,
      STATUS,
      capacity,
      price_per_hour,
      price_per_hour_currency,
      price_per_day,
      price_per_day_currency,
      primary_image_url,
      address,
      length_meters,
      year_built,
      description,
      amenities
    } = req.body;

    const boat = await Boat.create({
      boat_name,
      vendor_name,
      category_name,
      sub_category_name,
      STATUS: STATUS || null,
      capacity,
      price_per_hour,
      price_per_hour_currency,
      price_per_day,
      price_per_day_currency,
      primary_image_url,
      address: address || null,
      length_meters,
      year_built,
      description,
      amenities
    });
    res.status(201).json({ message: "Boat added successfully", data: boat });
  } catch (error) {
    res.status(500).json({ message: "Failed to add boat", error: error.message });
  }
});

router.put("/update-boat/:id", async (req, res) => {
  try {
    const {
      boat_name,
      vendor_name,
      category_name,
      sub_category_name,
      STATUS,
      capacity,
      price_per_hour,
      price_per_hour_currency,
      price_per_day,
      price_per_day_currency,
      primary_image_url,
      address,
      length_meters,
      year_built,
      description,
      amenities
    } = req.body;

    const [rows] = await Boat.update(
      {
        boat_name,
        vendor_name,
        category_name,
        sub_category_name,
        STATUS,
        capacity,
        price_per_hour,
        price_per_hour_currency,
        price_per_day,
        price_per_day_currency,
        primary_image_url,
        address: address ?? undefined,
        length_meters,
        year_built,
        description,
        amenities
      },
      { where: { id: req.params.id } }
    );
    res.status(200).json({ message: "Boat updated successfully", data: { rowsUpdated: rows } });
  } catch (error) {
    res.status(500).json({ message: "Failed to update boat", error: error.message });
  }
});

// Fetch boat categories from boat_category table; sub_categories from Boat table
router.get("/category-list", async (req, res) => {
  try {
    const categories = await BoatCategory.findAll({
      attributes: ["id", "category_name", "image"],
      order: [["category_name", "ASC"]],
      raw: true
    });

    const categoryList = await Promise.all(
      categories.map(async (row) => {
        const categoryName = row.category_name?.trim() || "";
        const imageUrl = row.image?.trim() || null;

        const subCategoryRows = await Boat.findAll({
          attributes: ["sub_category_name"],
          where: {
            category_name: categoryName,
            sub_category_name: { [Sequelize.Op.ne]: null }
          },
          raw: true
        });

        const subCategories = [
          ...new Set(
            subCategoryRows
              .map((r) => r.sub_category_name?.trim())
              .filter(Boolean)
          )
        ].sort();

        return {
          category: categoryName,
          category_image_url: imageUrl,
          sub_categories: subCategories
        };
      })
    );

    res.status(200).json({
      message: "Category list fetched successfully",
      data: categoryList
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to get category list", error: error.message });
  }
});




module.exports = router;
