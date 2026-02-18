const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const CateringOrder = sequelize.define(
  "CateringOrder",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    caterer_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    address_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    no_of_persons: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true
    },
    coupon_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    total: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: true
    },
    payment_method: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    payment_status: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    queries: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    items_ordered: {
      type: DataTypes.TEXT("long"),
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
    tableName: "catering_orders",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = CateringOrder;
