const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TransitVehicle = sequelize.define(
  "TransitVehicle",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    model: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    registration_no: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    vehicle_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Year(4) in DB"
    },
    transmission_type: {
      type: DataTypes.ENUM("Automatic", "Manual"),
      allowNull: true
    },
    fuel_type: {
      type: DataTypes.ENUM("Petrol", "Diesel", "Electric", "Hybrid", "Other"),
      allowNull: true
    },
    seat_capacity: {
      type: DataTypes.TINYINT,
      allowNull: true
    },
    price_per_hour: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    price_per_day: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    is_available: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 1
    },
    images: {
      type: DataTypes.STRING(500),
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
    tableName: "transit_vehicles",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = TransitVehicle;
