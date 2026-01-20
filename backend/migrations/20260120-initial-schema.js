'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: false },
      email: { type: Sequelize.STRING(120), allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: false },
      role: { type: Sequelize.ENUM('admin', 'user'), allowNull: false, defaultValue: 'user' },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('players', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: false },
      gender: { type: Sequelize.ENUM('h', 'm'), allowNull: false },
      elo: { type: Sequelize.INTEGER, allowNull: false },
      initial_elo: { type: Sequelize.INTEGER, allowNull: false },
      is_goalkeeper: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      wins: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      losses: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('matches', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      match_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: { type: Sequelize.ENUM('pending', 'completed'), allowNull: false, defaultValue: 'pending' },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('teams', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      match_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'matches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING(120), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('team_players', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      player_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'players', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.addConstraint('team_players', {
      fields: ['team_id', 'player_id'],
      type: 'unique',
      name: 'team_players_unique_team_player',
    });

    await queryInterface.createTable('match_results', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      match_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'matches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      winning_team_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'teams', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      is_draw: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      goal_diff: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      mvp_player_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'players', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('distinctions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      match_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'matches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      player_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'players', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      type: { type: Sequelize.STRING(50), allowNull: false },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('elo_history', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      match_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'matches', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      player_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'players', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      elo_before: { type: Sequelize.INTEGER, allowNull: false },
      elo_after: { type: Sequelize.INTEGER, allowNull: false },
      delta: { type: Sequelize.INTEGER, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('app_config', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      w_elo: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 1.0 },
      w_genero: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 5.0 },
      w_social: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0.5 },
      gender_tolerance: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      win_delta: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 100 },
      draw_delta: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      loss_delta: { type: Sequelize.INTEGER, allowNull: false, defaultValue: -100 },
      use_social_default: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });

    await queryInterface.createTable('config_history', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      config_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'app_config', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      changed_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      changes: { type: Sequelize.JSONB, allowNull: false, defaultValue: {} },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('config_history');
    await queryInterface.dropTable('app_config');
    await queryInterface.dropTable('elo_history');
    await queryInterface.dropTable('distinctions');
    await queryInterface.dropTable('match_results');
    await queryInterface.dropTable('team_players');
    await queryInterface.dropTable('teams');
    await queryInterface.dropTable('matches');
    await queryInterface.dropTable('players');
    await queryInterface.dropTable('users');

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_players_gender";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_matches_status";');
  },
};
