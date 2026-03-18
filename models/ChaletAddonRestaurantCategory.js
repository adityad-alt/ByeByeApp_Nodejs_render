const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ChaletAddonRestaurantCategory = sequelize.define(
  "ChaletAddonRestaurantCategory",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    restaurant_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    category_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    status: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE(6),
      allowNull: false
    },
    updated_at: {
      type: DataTypes.DATE(6),
      allowNull: false
    }
  },
  {
    tableName: "allora_chalet_addon_restaurant_category",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = ChaletAddonRestaurantCategory;
