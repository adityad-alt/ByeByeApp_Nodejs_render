const express = require("express");
const {
  Boat,
  BoatCategory,
  BoatSubCategory,
  BoatAmenity,
  BoatAddonItem,
  BoatSpecialPackage,
  BoatProduct,
  BoatAddonRestaurant,
  BoatProductCategory
} = require("../models");
const { Sequelize } = require("sequelize");

const router = express.Router();

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
  const galleryImages = parseImagesFromString(primaryImgRaw).filter(Boolean);
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

// Haversine helpers: distance between two lat/long points in kilometers
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function distanceInKm(lat1, lon1, lat2, lon2) {
  const n1 = Number(lat1);
  const n2 = Number(lon1);
  const n3 = Number(lat2);
  const n4 = Number(lon2);

  if ([n1, n2, n3, n4].some((v) => Number.isNaN(v))) {
    return null;
  }

  const R = 6371; // km
  const dLat = toRad(n3 - n1);
  const dLon = toRad(n4 - n2);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(n1)) * Math.cos(toRad(n3)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

router.get("/all-boat-list", async (req, res) => {
  try {
    const { category, sub_category, lat: userLat, long: userLong, radius_km: radiusKm } = req.query;
    const where = {};

    if (category) {
      where.category_name = category;
    }
    if (sub_category) {
      where.sub_category_name = sub_category;
    }

    const boatList = await Boat.findAll({
      where,
      order: [
        ["created_at", "DESC"],
        ["id", "DESC"]
      ]
    });

    let data = boatList.map(normalizeBoat);

    const hasUserLocation = userLat != null && userLat !== "" && userLong != null && userLong !== "";
    const radius = radiusKm != null && radiusKm !== "" ? Number(radiusKm) : 100;

    if (hasUserLocation) {
      const userLatNum = Number(userLat);
      const userLongNum = Number(userLong);

      if (!Number.isNaN(userLatNum) && !Number.isNaN(userLongNum)) {
        data = data
          .map((boat) => {
            const boatLat = boat.lat ?? boat.latitude;
            const boatLong = boat.long ?? boat.longitude;
            const dist = distanceInKm(userLatNum, userLongNum, boatLat, boatLong);
            if (dist == null) return null;
            return { ...boat, distance_km: dist };
          })
          .filter((b) => b && b.distance_km <= radius)
          .sort((a, b) => a.distance_km - b.distance_km);
      }
    }

    res.status(200).json({
      message: "Boat list fetched successfully",
      data
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

    const data = subCategories.map((r) => ({
      ...r,
      image_url: r.image?.trim() || null
    }));

    res.status(200).json({
      message: "Subcategory list fetched successfully",
      data
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
      lat,
      long,
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
      lat,
      long,
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
      lat,
      long,
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
        lat,
        long,
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

// Fetch boat addon items from boat_addon_items table (optional query: status=ACTIVE|INACTIVE)
router.get("/addon-items", async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && ["ACTIVE", "INACTIVE"].includes(String(status).toUpperCase())) {
      where.STATUS = String(status).toUpperCase();
    }

    const rows = await BoatAddonItem.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [["addon_package_name", "ASC"]],
      raw: true
    });

    const data = rows.map((r) => ({
      ...r,
      addon_image: r.addon_image || null
    }));

    res.status(200).json({
      message: "Boat addon items fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get boat addon items",
      error: error.message
    });
  }
});

// Fetch boat special packages from boat_special_packages table (optional query: status=ACTIVE|INACTIVE)
router.get("/special-packages", async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status && ["ACTIVE", "INACTIVE"].includes(String(status).toUpperCase())) {
      where.STATUS = String(status).toUpperCase();
    }

    const rows = await BoatSpecialPackage.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [["package_name", "ASC"]],
      raw: true
    });

    const data = rows.map((r) => ({
      ...r,
      package_images: r.package_images || null
    }));

    res.status(200).json({
      message: "Boat special packages fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get boat special packages",
      error: error.message
    });
  }
});

// Fetch boat products from boat_products table (optional query: status=Active|Inactive|Draft, category, sub_category)
router.get("/products", async (req, res) => {
  try {
    const { status, category, sub_category } = req.query;
    const where = {};
    if (status && ["Active", "Inactive", "Draft"].includes(String(status))) {
      where.status = String(status);
    }
    if (category && String(category).trim()) {
      where.category = String(category).trim();
    }
    if (sub_category != null && String(sub_category).trim() !== "") {
      where.sub_category = String(sub_category).trim();
    }

    const rows = await BoatProduct.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [["product_name", "ASC"]],
      raw: true
    });

    res.status(200).json({
      message: "Boat products fetched successfully",
      data: rows
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get boat products",
      error: error.message
    });
  }
});

// Fetch boat addon restaurants from boat_addon_restaurants table
router.get("/addon-restaurants", async (req, res) => {
  try {
    const rows = await BoatAddonRestaurant.findAll({
      order: [["restaurant_name", "ASC"]],
      raw: true
    });

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

    const data = rows.map((r) => {
      const categories = parseJson(r.categories);
      const images = parseJson(r.images);
      const items = parseJson(r.items);
      return {
        ...r,
        categories: Array.isArray(categories) ? categories : categories,
        images: Array.isArray(images) ? images : images,
        items: Array.isArray(items) ? items : items
      };
    });

    res.status(200).json({
      message: "Boat addon restaurants fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get boat addon restaurants",
      error: error.message
    });
  }
});

// Boat product categories: 1) list all, 2) get one by category_name (query: category_name)
// Returns category_name, category_icon_url (full URL), description, status
router.get("/boat-product-categories", async (req, res) => {
  try {
    const { category_name: categoryName } = req.query;

    if (categoryName != null && String(categoryName).trim() !== "") {
      const name = String(categoryName).trim();
      const item = await BoatProductCategory.findOne({
        where: { category_name: name },
        raw: true
      });
      if (!item) {
        return res.status(404).json({
          message: "Boat product category not found",
          data: null
        });
      }
      const data = {
        ...item,
        category_icon_url: item.category_icon?.trim() || null
      };
      return res.status(200).json({
        message: "Boat product category fetched successfully",
        data
      });
    }

    const rows = await BoatProductCategory.findAll({
      order: [["category_name", "ASC"]],
      raw: true
    });
    const list = rows.map((row) => ({
      ...row,
      category_icon_url: row.category_icon?.trim() || null
    }));
    res.status(200).json({
      message: "Boat product categories fetched successfully",
      data: list
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get boat product categories",
      error: error.message
    });
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
