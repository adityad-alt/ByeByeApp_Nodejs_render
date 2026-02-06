const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BoatBanner = sequelize.define(
  "BoatBanner",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    banner_title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    link_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    banner_image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    STATUS: {
      type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
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
    tableName: "boat_banners",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = BoatBanner;
