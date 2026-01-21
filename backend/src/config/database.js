const { Sequelize } = require('sequelize');

const dialect = process.env.DB_DIALECT || 'postgres';
const storage = process.env.DB_STORAGE || ':memory:';
const connectionUrl = process.env.DATABASE_URL || '';
const sslEnabled = process.env.DB_SSL === 'true' || process.env.DB_SSL === '1';

const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  dialect,
  storage: dialect === 'sqlite' ? storage : undefined,
  logging: false,
  dialectOptions: sslEnabled ? { ssl: { require: true, rejectUnauthorized: false } } : undefined,
};

const sequelize = connectionUrl
  ? new Sequelize(connectionUrl, baseConfig)
  : new Sequelize(
      process.env.DB_NAME || 'fuchibol',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      baseConfig
    );

module.exports = { sequelize };
