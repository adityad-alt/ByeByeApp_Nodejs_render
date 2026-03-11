const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BoatDestination = sequelize.define(
  "BoatDestination",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },
    boat_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    destination_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    destination_code: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    country: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    port_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    port_code: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false
    }
  },
  {
    tableName: "bluewave_destinations",
    timestamps: false
  }
);

module.exports = BoatDestination;

