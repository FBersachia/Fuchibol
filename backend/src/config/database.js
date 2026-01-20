const { Sequelize } = require('sequelize');

const dialect = process.env.DB_DIALECT || 'postgres';
const storage = process.env.DB_STORAGE || ':memory:';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'fuchibol',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    dialect,
    storage: dialect === 'sqlite' ? storage : undefined,
    logging: false,
  }
);

module.exports = { sequelize };
