const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BoatParkingBooking = sequelize.define(
  "BoatParkingBooking",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "User who made the parking booking"
    },
    booking_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Display code e.g. BK-001"
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: "Customer name for display"
    },
    parking_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: "Reference to boat_parkings.id"
    },
    parking_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    marina_name: {
      type: DataTypes.STRING(255),
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
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    end_date: {
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
    check_in: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Check-in datetime"
    },
    check_out: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Check-out datetime"
    },
    duration_hours: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Duration in hours"
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: true,
      defaultValue: "KWD"
    },
    payment_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "e.g. PAID, PENDING (same as old STATUS)"
    },
    transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    booking_status: {
      type: DataTypes.ENUM("booked", "cancelled", "completed"),
      allowNull: true,
      defaultValue: "booked"
    },
    notes: {
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
    tableName: "boat_parking_bookings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = BoatParkingBooking;
