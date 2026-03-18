const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ChaletCategory = sequelize.define(
  "ChaletCategory",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    category_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    status: {
      type: DataTypes.TINYINT(1),
      allowNull: false,
      defaultValue: 1
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
    tableName: "allora_chalet_category",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = ChaletCategory;
