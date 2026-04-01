const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ChaletReview = sequelize.define(
  "ChaletReview",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    chalet_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    customer_id: {
      // Uses req.user.id from auth middleware
      type: DataTypes.INTEGER,
      allowNull: false
    },
    rating: {
      // 1..5
      type: DataTypes.INTEGER,
      allowNull: false
    },
    review: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "allora_chalet_review",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false
  }
);

module.exports = ChaletReview;

