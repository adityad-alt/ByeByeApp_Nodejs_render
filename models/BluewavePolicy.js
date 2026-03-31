const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const BluewavePolicy = sequelize.define(
  "BluewavePolicy",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    policy_type: {
      // Previously ENUM("refund", "terms", "privacy").
      // Now a free-text string so we can support:
      // - "boat booking"
      // - "Parking"
      // - "Seafarer"
      // as well as existing types used elsewhere.
      type: DataTypes.STRING(100),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT("long"),
      allowNull: false
    },
    status: {
      type: DataTypes.TINYINT,
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
    tableName: "bluewave_policies",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = BluewavePolicy;

