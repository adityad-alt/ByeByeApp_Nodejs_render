const path = require("path");
const fs = require("fs").promises;
const envPath = path.join(__dirname, ".env");
require("dotenv").config({ path: envPath });
if (!process.env.DB_HOST) {
  console.warn("Env: DB_HOST not set. Loaded from:", envPath);
}
const express = require("express");
const cors = require("cors");
const sequelize = require("./db");
const authRoutes = require("./routes/authRoutes");
const boatRoutes = require("./routes/boats");
const boatBookingRoutes = require("./routes/boat_bookings");
const advertisementRoutes = require("./routes/advertisement");
const boatParkingRoutes = require("./routes/boat_parking");
const boatParkingBookingsRoutes = require("./routes/boat_parking_bookings");
const boatSeafarersRoutes = require("./routes/boat_seafarers");
const boatSeafareBookingsRoutes = require("./routes/boat_seafare_bookings");
const userDetailsRoutes = require("./routes/user_details");
const transitCarRentRoutes = require("./routes/transit_car_rent");
const transitTripBookingRoutes = require("./routes/transit_trip_booking");
const jetsRoutes = require("./routes/jets");
const escortServiceRoutes = require("./routes/escort_service");
const deliveryRoutes = require("./routes/delivery");
const chaletRoutes = require("./routes/chalet");
const catererRoutes = require("./routes/caterer");
const shopRoutes = require("./routes/shop");
const notificationsRoutes = require("./routes/notifications");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Handle invalid JSON body (e.g. client sends "POST /api/..." or plain text as body)
app.use((err, req, res, next) => {
  if (err.status === 400 && err.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Invalid JSON in request body",
      hint: "Send a valid JSON object. Example: { \"name\": \"Service\", \"price\": 99.99 }"
    });
  }
  next(err);
});

app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

const avatarsDir = path.join(__dirname, "public", "avatars");
const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

// GET /avatars/list – list all avatar filenames and URLs (no DB, reads folder)
app.get("/avatars/list", async (req, res) => {
  try {
    const files = await fs.readdir(avatarsDir);
    const baseUrl = `${req.protocol}://${req.get("host")}`.replace(/\/$/, "");
    const avatars = files
      .filter((f) => IMAGE_EXT.includes(path.extname(f).toLowerCase()))
      .map((filename) => ({
        filename,
        url: `${baseUrl}/avatars/${encodeURIComponent(filename)}`,
      }));
    res.json({ avatars });
  } catch (err) {
    if (err.code === "ENOENT") {
      return res.json({ avatars: [] });
    }
    res.status(500).json({ message: "Failed to list avatars", error: err.message });
  }
});

// Static avatar images (e.g. from assets/avatar) – copy your PNGs to public/avatars/
app.use("/avatars", express.static(avatarsDir));

app.use("/auth", authRoutes);
app.use("/boats", boatRoutes);
app.use("/boat-bookings", boatBookingRoutes);
app.use("/advertisements", advertisementRoutes);
app.use("/boat-parking", boatParkingRoutes);
app.use("/boat-parking-bookings", boatParkingBookingsRoutes);
app.use("/seafarers", boatSeafarersRoutes);
app.use("/boat-seafare-bookings", boatSeafareBookingsRoutes);
app.use("/user-details", userDetailsRoutes);
app.use("/transit-car-rent", transitCarRentRoutes);
app.use("/transit-trip-booking", transitTripBookingRoutes);
app.use("/jets", jetsRoutes);
app.use("/escort-service", escortServiceRoutes);
app.use("/delivery", deliveryRoutes);
app.use("/chalets", chaletRoutes);
app.use("/caterer", catererRoutes);
app.use("/shop", shopRoutes);
app.use("/notifications", notificationsRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    const host = process.env.DB_HOST || "(not set)";
    const port = process.env.DB_PORT || 3306;
    console.error("Database connection failed:", error.message);
    console.error(`  Tried: ${host}:${port}`);
    console.error("  Check: 1) MySQL is running  2) Host/port correct in .env  3) Firewall/remote allowlist allows your IP");
  }
};

startServer();

