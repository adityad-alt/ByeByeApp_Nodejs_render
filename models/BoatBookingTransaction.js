const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BoatBookingTransaction = sequelize.define(
  "BoatBookingTransaction",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    order_id: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    boat_id: { type: DataTypes.INTEGER, allowNull: true },
    boat_name: { type: DataTypes.STRING(255), allowNull: true },
    boat_image_url: { type: DataTypes.STRING(500), allowNull: true },
    boat_address: { type: DataTypes.STRING(500), allowNull: true },
    customer_id: { type: DataTypes.INTEGER, allowNull: true },
    customer_name: { type: DataTypes.STRING(150), allowNull: true },
    customer_contact: { type: DataTypes.STRING(30), allowNull: true },
    customer_email: { type: DataTypes.STRING(150), allowNull: true },
    booking_date: { type: DataTypes.DATEONLY, allowNull: true },
    start_time: { type: DataTypes.TIME, allowNull: true },
    end_time: { type: DataTypes.TIME, allowNull: true },
    captain_name: { type: DataTypes.STRING(150), allowNull: true },
    captain_image_url: { type: DataTypes.STRING(500), allowNull: true },
    destination_name: { type: DataTypes.STRING(255), allowNull: true },
    destination_price: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    destination_time: { type: DataTypes.STRING(50), allowNull: true },
    pick_up_address: { type: DataTypes.STRING(500), allowNull: true },
    subtotal: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    discount_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true, defaultValue: 0 },
    coupon_code: { type: DataTypes.STRING(50), allowNull: true },
    total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    price_per_hour: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    transaction_type: { type: DataTypes.STRING(50), allowNull: true },
    transaction_id: { type: DataTypes.STRING(100), allowNull: true },
    payment_status: { type: DataTypes.STRING(50), allowNull: true },
    items_json: { type: DataTypes.JSON, allowNull: true },
    booking_status: {
      type: DataTypes.ENUM("booked", "cancelled", "completed"),
      allowNull: true,
      defaultValue: "booked"
    },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true }
  },
  {
    tableName: "app_boat_booking_transactions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = BoatBookingTransaction;
