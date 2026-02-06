const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const Seafarer = sequelize.define(
  "Seafarer",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    full_name: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    license_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    specialty: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    certifications: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    profile_photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    documents_image: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    STATUS: {
      type: DataTypes.ENUM("active", "inactive", "blocked"),
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
    tableName: "boat_seafarers",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = Seafarer;
