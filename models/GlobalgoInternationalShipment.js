const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const GlobalgoInternationalShipment = sequelize.define(
  "GlobalgoInternationalShipment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    pickup_country: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    pickup_city: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    destination_country: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    destination_city: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    tableName: "globalgo_international_shipment",
    timestamps: false
  }
);

module.exports = GlobalgoInternationalShipment;
