const express = require("express");
const { BoatParking } = require("../models");
const router = express.Router();

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

// Get boat parking place list (optional query:
// - status = ACTIVE|INACTIVE|DRAFT
// - lat, long, radius_km for distance-based filtering (default radius 100km)
router.get("/", async (req, res) => {
  try {
    const {
      status,
      lat: userLat,
      long: userLong,
      lng: userLng,
      lon: userLon,
      longitude: userLongitude,
      radius_km: radiusKm
    } = req.query;
    const where = {};
    if (status && ["ACTIVE", "INACTIVE", "DRAFT"].includes(String(status).toUpperCase())) {
      where.STATUS = String(status).toUpperCase();
    }

    const list = await BoatParking.findAll({
      where: Object.keys(where).length ? where : undefined,
      order: [["created_at", "DESC"]],
      raw: true
    });

    let data = list;

    const resolvedUserLong = userLong ?? userLng ?? userLon ?? userLongitude;
    const hasUserLocation =
      userLat != null &&
      userLat !== "" &&
      resolvedUserLong != null &&
      resolvedUserLong !== "";
    const parsedRadius = radiusKm != null && radiusKm !== "" ? Number(radiusKm) : 100;
    const radius = Number.isFinite(parsedRadius) && parsedRadius > 0 ? parsedRadius : 100;

    if (hasUserLocation) {
      const userLatNum = Number(userLat);
      const userLongNum = Number(resolvedUserLong);

      if (!Number.isNaN(userLatNum) && !Number.isNaN(userLongNum)) {
        data = list
          .map((item) => {
            const parkingLat = item.lat ?? item.latitude;
            const parkingLong = item.long ?? item.longitude;
            const dist = distanceInKm(userLatNum, userLongNum, parkingLat, parkingLong);
            if (dist == null) return null;
            return { ...item, distance_km: dist };
          })
          .filter((p) => p && p.distance_km <= radius)
          .sort((a, b) => a.distance_km - b.distance_km);
      }
    }

    res.status(200).json({
      message: "Boat parking list fetched successfully",
      data
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch boat parking list",
      error: error.message
    });
  }
});

module.exports = router;
