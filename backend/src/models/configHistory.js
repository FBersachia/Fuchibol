const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ConfigHistory = sequelize.define(
  'ConfigHistory',
  {
    config_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    changed_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    changes: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'config_history',
    underscored: true,
    timestamps: true,
  }
);

module.exports = ConfigHistory;
