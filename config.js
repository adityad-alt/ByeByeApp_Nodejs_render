// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 3306,
  database: 'u400614360_BYEBYE',
  user: 'u400614360_BYEBYE',
  password: 'Hackersworld@25'
};

// JWT configuration
const jwtConfig = {
  secret: 'your_super_secret_jwt_key_here_change_this_in_production',
  expiresIn: '7d' // Token expires in 7 days
};

module.exports = {
  dbConfig,
  jwtConfig
};