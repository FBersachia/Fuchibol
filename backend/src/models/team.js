const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Team = sequelize.define(
  'Team',
  {
    match_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
  },
  {
    tableName: 'teams',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Team;
