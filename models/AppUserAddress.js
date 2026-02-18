const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const AppUserAddress = sequelize.define(
  "AppUserAddress",
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
    governorate: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    area: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    block: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    street: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    building: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    floor: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    flat: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    is_default: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 0
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
    tableName: "app_user_addresses",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = AppUserAddress;
