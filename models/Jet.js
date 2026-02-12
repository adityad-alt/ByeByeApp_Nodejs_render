const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Jet = sequelize.define(
  "Jet",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    manufacturer: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    model: {
      type: DataTypes.STRING(120),
      allowNull: true
    },
    passenger_capacity: {
      type: DataTypes.TINYINT,
      allowNull: true
    },
    range_km: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cruise_speed_kmh: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    price_per_hour: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    price_per_trip: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    images: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    jet_type: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "ACTIVE"
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
    tableName: "jets",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = Jet;
