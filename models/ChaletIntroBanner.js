const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ChaletIntroBanner = sequelize.define(
  "ChaletIntroBanner",
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
    banner_image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER,
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
    tableName: "allora_chalet_intro_banner",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = ChaletIntroBanner;

