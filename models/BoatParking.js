const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BoatParking = sequelize.define(
  "BoatParking",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    parking_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    marina_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    STATUS: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE", "DRAFT"),
      allowNull: true
    },
    short_description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parking_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    location_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    full_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    access_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    checkin_instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    total_spots: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    max_boat_length: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    max_boat_width: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    max_draft: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    allowed_boat_types: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pricing_model: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    base_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    minimum_booking: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    overstay_fee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    tax_notes: {
      type: DataTypes.TEXT,
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
    available_247: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    advance_booking: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    booking_cutoff: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    blackout_dates: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    amenities: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rule_no_overnight: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    rule_engine_off: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    rule_no_loud_music: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    rule_waste_disposal: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    policy_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cover_image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    gallery_images: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    documents: {
      type: DataTypes.TEXT,
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
    tableName: "boat_parkings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = BoatParking;
