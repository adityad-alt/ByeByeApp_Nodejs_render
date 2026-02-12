const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const JetBooking = sequelize.define(
  "JetBooking",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    booking_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "Optional - links to User if logged in"
    },
    jet_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: "Optional - links to Jet"
    },
    manufacturer: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    model: {
      type: DataTypes.STRING(120),
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
    departure: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    destination: {
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
    return_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    return_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    passengers: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    jet_type: {
      type: DataTypes.STRING(50),
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
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "Pending"
    },
    booking_status: {
      type: DataTypes.STRING(50),
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
    tableName: "jet_bookings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = JetBooking;
