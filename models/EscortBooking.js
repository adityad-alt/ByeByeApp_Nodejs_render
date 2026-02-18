const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const EscortBooking = sequelize.define(
  "EscortBooking",
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
    full_name: {
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
    escort_service_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Hire VIP or Request Protection"
    },
    vip_service_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "Bodyguards, Escort, Babysitter, etc."
    },
    request_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    request_time: {
      type: DataTypes.TIME,
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
    location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    primary_location: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    special_requests: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    additional_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    additional_locations: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0
    },
    status: {
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
    tableName: "escort_bookings",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = EscortBooking;
