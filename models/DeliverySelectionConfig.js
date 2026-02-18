const { DataTypes } = require("sequelize");
const sequelize = require("../db");

/**
 * Stores selection/config data for delivery flows:
 * - Local delivery cities
 * - International pickup/destination countries & cities
 * - Sea cargo ports
 * - Car delivery car types + cities
 */
const DeliverySelectionConfig = sequelize.define(
  "DeliverySelectionConfig",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    delivery_type: {
      type: DataTypes.ENUM("local", "international", "sea_cargo", "car_delivery"),
      allowNull: false
    },
    country_code: {
      type: DataTypes.STRING(2),
      allowNull: true
    },
    country_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    city_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    port_name: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    car_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    is_pickup: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_dropoff: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    }
  },
  {
    tableName: "delivery_selection_config",
    timestamps: true,
    underscored: true
  }
);

module.exports = DeliverySelectionConfig;

