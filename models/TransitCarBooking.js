const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TransitCarBooking = sequelize.define(
  "TransitCarBooking",
  {
    booking_id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    model: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    vehicle_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    full_name: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    contact_details: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    email_id: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    driving_license_front: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    driving_license_back: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    dob: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    nationality: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    amount: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    payment_type: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    STATUS: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: "Pending"
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
    tableName: "transit_car_bookings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = TransitCarBooking;
