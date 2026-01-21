const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AppConfig = sequelize.define(
  'AppConfig',
  {
    w_elo: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 1.0,
    },
    w_genero: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 5.0,
    },
    w_social: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.5,
    },
    gender_tolerance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    win_delta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
    },
    draw_delta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    loss_delta: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: -100,
    },
    use_social_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'app_config',
    underscored: true,
    timestamps: true,
  }
);

module.exports = AppConfig;
