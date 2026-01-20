const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MatchResult = sequelize.define(
  'MatchResult',
  {
    match_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    winning_team_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_draw: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    goal_diff: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    mvp_player_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'match_results',
    underscored: true,
    timestamps: true,
  }
);

module.exports = MatchResult;
