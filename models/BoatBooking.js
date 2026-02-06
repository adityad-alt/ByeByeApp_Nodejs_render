const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BoatBooking = sequelize.define(
  "BoatBooking",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    boat_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    booking_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    price_per_hour: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    booking_status: {
      type: DataTypes.ENUM("booked", "cancelled", "completed"),
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "boat_bookings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

module.exports = BoatBooking;
