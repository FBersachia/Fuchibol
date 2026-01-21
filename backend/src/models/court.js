const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Court = sequelize.define(
  'Court',
  {
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'courts',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Court;
