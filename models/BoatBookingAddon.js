const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BoatBookingAddon = sequelize.define(
  "BoatBookingAddon",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    booking_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    source_type: {
      type: DataTypes.ENUM(
        "boat_addon_item",
        "boat_addon_restaurant",
        "boat_special_package",
        "boat_product"
      ),
      allowNull: false
    },
    source_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1
    },
    unit_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "boat_booking_addons",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = BoatBookingAddon;

