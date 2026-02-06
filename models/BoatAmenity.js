const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BoatAmenity = sequelize.define(
  "BoatAmenity",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    NAME: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    icon_image: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    STATUS: {
      type: DataTypes.ENUM("active", "inactive"),
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
    tableName: "boat_amenities",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = BoatAmenity;
