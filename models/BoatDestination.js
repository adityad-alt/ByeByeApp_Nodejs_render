const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BoatDestination = sequelize.define(
  "BoatDestination",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    latitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(9, 6),
      allowNull: false
    }
  },
  {
    tableName: "boat_booking_destination",
    timestamps: false
  }
);

module.exports = BoatDestination;

