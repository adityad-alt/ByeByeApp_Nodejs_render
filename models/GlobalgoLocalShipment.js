const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const GlobalgoLocalShipment = sequelize.define(
  "GlobalgoLocalShipment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
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
    tableName: "globalgo_local_shipment",
    timestamps: false
  }
);

module.exports = GlobalgoLocalShipment;
