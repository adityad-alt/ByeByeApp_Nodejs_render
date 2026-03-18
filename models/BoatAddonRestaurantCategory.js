const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BoatAddonRestaurantCategory = sequelize.define(
  "BoatAddonRestaurantCategory",
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
      type: DataTypes.DATE,
      allowNull: true
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "bluewave_addon_restaurant_category",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = BoatAddonRestaurantCategory;
