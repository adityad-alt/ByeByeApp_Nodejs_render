const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const GlobalgoSeaCargoShipment = sequelize.define(
  "GlobalgoSeaCargoShipment",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    origin_port: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    destination_port: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    container_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  },
  {
    tableName: "globalgo_sea_cargo_shipment",
    timestamps: false
  }
);

module.exports = GlobalgoSeaCargoShipment;
