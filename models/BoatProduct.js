const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BoatProduct = sequelize.define(
  "BoatProduct",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(120),
      allowNull: false
    },
    sub_category: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    currency: {
      type: DataTypes.CHAR(3),
      allowNull: false,
      defaultValue: "AED"
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    },
    stock_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM("Active", "Inactive", "Draft"),
      allowNull: false,
      defaultValue: "Active"
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
    tableName: "boat_products",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = BoatProduct;
