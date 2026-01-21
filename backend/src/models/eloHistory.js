const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const EloHistory = sequelize.define(
  'EloHistory',
  {
    match_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    player_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    elo_before: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    elo_after: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    delta: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'elo_history',
    underscored: true,
    timestamps: true,
  }
);

module.exports = EloHistory;
