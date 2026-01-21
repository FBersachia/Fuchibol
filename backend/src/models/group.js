const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Group = sequelize.define(
  'Group',
  {
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'groups',
    underscored: true,
    timestamps: true,
  }
);

module.exports = Group;
