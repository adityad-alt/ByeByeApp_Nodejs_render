const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ChaletBooking = sequelize.define(
  "ChaletBooking",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    chalet_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    check_in_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    check_out_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    guest_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    contact_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    email_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    booking_status: {
      type: DataTypes.STRING(30),
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
    }
  },
  {
    tableName: "chalet_bookings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

module.exports = ChaletBooking;
