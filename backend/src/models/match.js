const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Match = sequelize.define(
  'Match',
  {
    match_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    court_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'matches',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Match;
