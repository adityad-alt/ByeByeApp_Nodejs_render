const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BYEFeedback = sequelize.define(
  "BYEFeedback",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    email_id: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "BYE_feedback",
    timestamps: false
  }
);

module.exports = BYEFeedback;

