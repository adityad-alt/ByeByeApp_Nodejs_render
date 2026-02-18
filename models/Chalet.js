const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Chalet = sequelize.define(
  "Chalet",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    price_per_night: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    bedrooms: { type: DataTypes.INTEGER, allowNull: true },
    bathrooms: { type: DataTypes.INTEGER, allowNull: true },
    max_guests: { type: DataTypes.INTEGER, allowNull: true },
    image_url: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    owner_id: { type: DataTypes.INTEGER, allowNull: true },
    category_id: { type: DataTypes.INTEGER, allowNull: true },
    sub_category_id: { type: DataTypes.INTEGER, allowNull: true },
    type: { type: DataTypes.STRING(50), allowNull: true },
    title: { type: DataTypes.STRING(255), allowNull: true },
    title_ar: { type: DataTypes.STRING(255), allowNull: true },
    max_persons: { type: DataTypes.INTEGER, allowNull: true },
    max_stay_days: { type: DataTypes.INTEGER, allowNull: true },
    total_rooms: { type: DataTypes.INTEGER, allowNull: true },
    price_per_day: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    rate_night: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    area_m2: { type: DataTypes.STRING(50), allowNull: true },
    year_built: { type: DataTypes.STRING(50), allowNull: true },
    amenities_json: { type: DataTypes.TEXT, allowNull: true },
    primary_image_url: { type: DataTypes.TEXT, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true }
  },
  {
    tableName: "chalet",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = Chalet;
