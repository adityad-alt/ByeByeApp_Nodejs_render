const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BoatParkingBooking = sequelize.define(
  "BoatParkingBooking",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      allowNull: false
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "User who made the booking"
    },

    booking_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: false, // it's indexed, not unique
    },

    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },

    parking_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },

    parking_name: {
      type: DataTypes.STRING(255),
      allowNull: false
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
      allowNull: false
    },

    check_out: {
      type: DataTypes.DATE,
      allowNull: false
    },

    duration_hours: {
      type: DataTypes.INTEGER,
      allowNull: false
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
      allowNull: true
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
      allowNull: true,
      defaultValue: DataTypes.NOW // CURRENT_TIMESTAMP
    },

    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "bluewave_parking_bookings",
    timestamps: false, // ⚠️ IMPORTANT (we manually defined timestamps)
    indexes: [
      {
        name: "booking_code_index",
        fields: ["booking_code"]
      }
    ]
  }
);

module.exports = BoatParkingBooking;