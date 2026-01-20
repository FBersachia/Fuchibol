const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Distinction = sequelize.define(
  'Distinction',
  {
    match_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    player_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: 'distinctions',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Distinction;
