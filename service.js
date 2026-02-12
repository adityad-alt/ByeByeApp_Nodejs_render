require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./db");
const authRoutes = require("./routes/authRoutes");
const boatRoutes = require("./routes/boats");
const boatBookingRoutes = require("./routes/boat_bookings");
const advertisementRoutes = require("./routes/advertisement");
const boatParkingRoutes = require("./routes/boat_parking");
const boatSeafarersRoutes = require("./routes/boat_seafarers");
const userDetailsRoutes = require("./routes/user_details");
const transitCarRentRoutes = require("./routes/transit_car_rent");
const transitTripBookingRoutes = require("./routes/transit_trip_booking");
const jetsRoutes = require("./routes/jets");
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

app.use("/auth", authRoutes);
app.use("/boats", boatRoutes);
app.use("/boat-bookings", boatBookingRoutes);
app.use("/advertisements", advertisementRoutes);
app.use("/boat-parking", boatParkingRoutes);
app.use("/seafarers", boatSeafarersRoutes);
app.use("/user-details", userDetailsRoutes);
app.use("/transit-car-rent", transitCarRentRoutes);
app.use("/transit-trip-booking", transitTripBookingRoutes);
app.use("/jets", jetsRoutes);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log("Database connected");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
  }
};

startServer();

