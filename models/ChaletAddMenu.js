const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ChaletAddMenu = sequelize.define(
  "ChaletAddMenu",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "allora_chalet_addon_restaurants",
        key: "id"
      }
    },
    item_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "KD"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    images: {
      type: DataTypes.STRING(500),
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
    tableName: "allora_chalet_add_menu",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = ChaletAddMenu;
