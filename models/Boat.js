const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Boat = sequelize.define(
  "Boat",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    boat_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    vendor_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    category_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    sub_category_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    STATUS: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    price_per_hour: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    price_per_hour_currency: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    price_per_day: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    price_per_day_currency: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    primary_image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    long: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    length_meters: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true
    },
    year_built: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    amenities: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON array/object, e.g. list of amenities"
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
    tableName: "boats_create_new",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = Boat;
