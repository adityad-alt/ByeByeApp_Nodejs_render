const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const SeafarerTransaction = sequelize.define(
  "SeafarerTransaction",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    transaction_code: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    order_code: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    customer_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    customer_email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    customer_type: {
      type: DataTypes.ENUM("individual", "corporate"),
      allowNull: true,
      defaultValue: "individual"
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    payment_status: {
      type: DataTypes.ENUM("paid", "pending", "failed", "refunded"),
      allowNull: true,
      defaultValue: "pending"
    },
    payment_method: {
      type: DataTypes.ENUM("card", "bank_transfer", "cash", "wallet"),
      allowNull: true
    },
    transaction_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    STATUS: {
      type: DataTypes.ENUM("completed", "pending", "cancelled"),
      allowNull: true,
      defaultValue: "pending"
    },
    seafarer_id: {
      type: DataTypes.BIGINT,
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
    tableName: "seafarer_transactions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = SeafarerTransaction;
