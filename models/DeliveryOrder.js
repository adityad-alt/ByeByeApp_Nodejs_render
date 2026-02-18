const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const DeliveryOrder = sequelize.define(
  "DeliveryOrder",
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
      allowNull: true
    },
    delivery_type: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    pickup_city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    drop_off_city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    pickup_country: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    destination_country: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    destination_city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    origin_port: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    destination_port: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    container_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    car_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    approximate_value: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    dimensions: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    weight: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    pick_up_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    delivery_address: {
      type: DataTypes.TEXT,
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
    schedule_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    time_slot_index: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    payment_type: {
      type: DataTypes.STRING(50),
      allowNull: true
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
    tableName: "delivery_orders",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = DeliveryOrder;
