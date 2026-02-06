const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  "u400614360_BYEBYE",
  "u400614360_BYEBYE",
  "Hackersworld@25",
  {
    host: "auth-db1448.hstgr.io", // Hostinger DB host
    dialect: "mysql",
    port: 3306,
    logging: false
  }
);

module.exports = sequelize;
