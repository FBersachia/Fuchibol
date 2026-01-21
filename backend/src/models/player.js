const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Player = sequelize.define(
  'Player',
  {
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('h', 'm'),
      allowNull: false,
    },
    elo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    initial_elo: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    is_goalkeeper: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    wins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    losses: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'players',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeValidate(player) {
        if (player.initial_elo === undefined || player.initial_elo === null) {
          player.initial_elo = player.elo;
        }
      },
    },
  }
);

module.exports = Player;
