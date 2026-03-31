const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const SeafarerJob = sequelize.define(
  "SeafarerJob",
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    full_name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    license_number: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    specialty: {
      type: DataTypes.STRING(150),
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
    profile_photo_name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    profile_photo_path: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    document_images: {
      type: DataTypes.JSON,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "pending"
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: sequelize.literal("CURRENT_TIMESTAMP")
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    tableName: "bluewave_seafarer_jobs",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at"
  }
);

module.exports = SeafarerJob;

