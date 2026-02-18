const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ShopOrder = sequelize.define(
  "ShopOrder",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    total: { type: DataTypes.DECIMAL(12, 3), allowNull: false },
    status: { type: DataTypes.STRING(50), allowNull: true, defaultValue: "placed" },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true }
  },
  {
    tableName: "shop_order",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = ShopOrder;
