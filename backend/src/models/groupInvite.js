const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const GroupInvite = sequelize.define(
  'GroupInvite',
  {
    group_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    player_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    token: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('general', 'specific'),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    max_uses: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    used_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'group_invites',
    underscored: true,
    timestamps: true,
  }
);

module.exports = GroupInvite;
