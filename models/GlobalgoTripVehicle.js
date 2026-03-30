const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const GlobalgoTripVehicle = sequelize.define(
  "GlobalgoTripVehicle",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    model: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    registration_no: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    vehicle_year: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    transmission_type: {
      type: DataTypes.ENUM("Automatic", "Manual"),
      allowNull: false
    },
    fuel_type: {
      type: DataTypes.ENUM("Petrol", "Diesel", "Electric", "Hybrid", "Other"),
      allowNull: false
    },
    seat_capacity: {
      type: DataTypes.TINYINT,
      allowNull: false
    },
    price_per_km: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: "KWD"
    },
    is_available: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1,
      comment: "0=Not Available 1=Available"
    },
    images: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    cover_image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    long: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    inventory_numbers: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "globalgo_trip_vehicles",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = GlobalgoTripVehicle;
