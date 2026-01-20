const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TeamPlayer = sequelize.define(
  'TeamPlayer',
  {
    team_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    player_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'team_players',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['team_id', 'player_id'],
      },
    ],
  }
);

module.exports = TeamPlayer;
