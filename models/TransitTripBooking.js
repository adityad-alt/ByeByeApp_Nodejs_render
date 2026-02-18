const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const TransitTripBooking = sequelize.define(
  "TransitTripBooking",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    trip_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Logged-in user id (app_user.id); used to fetch my-bookings"
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    passenger_name: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    contact_number: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    email_id: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    pickup_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    drop_address: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    trip_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    trip_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    driver_details: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    driver_contact_number: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    fare: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    payment_method: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    payment_status: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    trip_status: {
      type: DataTypes.STRING(255),
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
    tableName: "transit_trip_bookings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = TransitTripBooking;
