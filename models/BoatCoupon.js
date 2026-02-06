const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BoatCoupon = sequelize.define(
  "BoatCoupon",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    coupon_code: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    discount_type: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    discount_value: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    minimum_order: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    valid_from: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    valid_to: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    usage_limit: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    times_used: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    STATUS: {
      type: DataTypes.STRING(50),
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
    tableName: "boat_coupons",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = BoatCoupon;
