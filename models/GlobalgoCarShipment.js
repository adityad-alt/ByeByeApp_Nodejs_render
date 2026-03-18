const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const GlobalgoCarShipment = sequelize.define(
  "GlobalgoCarShipment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    car_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    pickup_city: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    drop_off_city: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    tableName: "globalgo_car_shipment",
    timestamps: false
  }
);

module.exports = GlobalgoCarShipment;
