// models/byebyeUserFavouriteList.js

const { DataTypes } = require("sequelize");
const sequelize = require("../db");

const ByebyeUserFavouriteList = sequelize.define(
  "ByebyeUserFavouriteList",
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    item_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    item_type: {
      type: DataTypes.STRING(50),
    },
  },
  {
    tableName: "byebye_user_favourite_list",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ByebyeUserFavouriteList;