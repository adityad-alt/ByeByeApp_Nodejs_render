const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AppUserBoat = sequelize.define(
  "AppUserBoat",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    boat_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    height: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    width: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    boat_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    civil_id_image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    license_image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    additional_images: {
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
    tableName: "app_user_boat",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = AppUserBoat;
