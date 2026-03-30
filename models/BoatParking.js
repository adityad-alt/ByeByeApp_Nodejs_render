const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BoatParking = sequelize.define(
  "BoatParking",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },

    parking_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    marina_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    STATUS: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
      allowNull: false,
      defaultValue: "ACTIVE"
    },

    short_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    parking_type: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    location_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    full_address: {
      type: DataTypes.TEXT,
      allowNull: false
    },

    lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },

    long: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },

    total_spots: {
      type: DataTypes.INTEGER,
      allowNull: false
    },

    pricing_model: {
      type: DataTypes.ENUM("PER_HOUR", "PER_DAY", "PER_WEEK", "PER_MONTH"),
      allowNull: false
    },

    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },

    currency: {
      type: DataTypes.ENUM("USD", "SAR", "AED", "EUR", "KD"),
      allowNull: false
    },

    minimum_booking: {
      type: DataTypes.STRING(100),
      allowNull: true
    },

    overstay_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },

    weekday_from: {
      type: DataTypes.TIME,
      allowNull: true
    },

    weekday_to: {
      type: DataTypes.TIME,
      allowNull: true
    },

    weekend_from: {
      type: DataTypes.TIME,
      allowNull: true
    },

    weekend_to: {
      type: DataTypes.TIME,
      allowNull: true
    },

    amenities: {
      type: DataTypes.STRING(500),
      allowNull: true
    },

    cover_image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },

    gallery_images: {
      type: DataTypes.TEXT("long"), // LONGTEXT
      allowNull: true
    },

    video: {
      type: DataTypes.STRING(500),
      allowNull: true
    },

    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "bluewave_parking_list",
    timestamps: false // ⚠️ DB handles timestamps
  }
);

module.exports = BoatParking;