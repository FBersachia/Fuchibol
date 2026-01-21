'use strict';

async function tableExists(queryInterface, name) {
  const tables = await queryInterface.showAllTables();
  const normalized = tables.map((t) => (typeof t === 'object' ? t.tableName : t));
  return normalized.includes(name);
}

async function columnExists(queryInterface, tableName, column) {
  if (!(await tableExists(queryInterface, tableName))) return false;
  const columns = await queryInterface.describeTable(tableName);
  return Object.prototype.hasOwnProperty.call(columns, column);
}

async function indexExists(queryInterface, tableName, indexName) {
  if (!(await tableExists(queryInterface, tableName))) return false;
  const indexes = await queryInterface.showIndex(tableName);
  return indexes.some((idx) => idx.name === indexName);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await tableExists(queryInterface, 'groups'))) {
      await queryInterface.createTable('groups', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        name: { type: Sequelize.STRING(120), allowNull: false },
        slug: { type: Sequelize.STRING(40), allowNull: false, unique: true },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      });
    }

    if (!(await tableExists(queryInterface, 'group_members'))) {
      await queryInterface.createTable('group_members', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        group_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'groups', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        user_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        role: {
          type: Sequelize.ENUM('admin', 'member'),
          allowNull: false,
          defaultValue: 'member',
        },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      });
    }

    if (!(await tableExists(queryInterface, 'group_invites'))) {
      await queryInterface.createTable('group_invites', {
        id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
        group_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'groups', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        player_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'players', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        created_by: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        token: { type: Sequelize.STRING(120), allowNull: false, unique: true },
        type: { type: Sequelize.ENUM('general', 'specific'), allowNull: false },
        expires_at: { type: Sequelize.DATE, allowNull: false },
        max_uses: { type: Sequelize.INTEGER, allowNull: false },
        used_count: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        revoked_at: { type: Sequelize.DATE, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      });
    }

    if (!(await columnExists(queryInterface, 'users', 'gender'))) {
      await queryInterface.addColumn('users', 'gender', {
        type: Sequelize.ENUM('h', 'm'),
        allowNull: true,
      });
    }

    const groupScopedTables = [
      'players',
      'matches',
      'teams',
      'team_players',
      'match_results',
      'distinctions',
      'elo_history',
      'app_config',
      'config_history',
      'courts',
    ];

    for (const table of groupScopedTables) {
      if (!(await columnExists(queryInterface, table, 'group_id'))) {
        await queryInterface.addColumn(table, 'group_id', {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'groups', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        });
      }
    }

    if (!(await columnExists(queryInterface, 'players', 'deleted_at'))) {
      await queryInterface.addColumn('players', 'deleted_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    let groupId = null;
    const [existingGroup] = await queryInterface.sequelize.query(
      "SELECT id FROM groups WHERE slug = 'fuchiboloculto' LIMIT 1;"
    );
    if (existingGroup.length > 0) {
      groupId = existingGroup[0].id;
    } else {
      const [groupRows] = await queryInterface.sequelize.query(
        "INSERT INTO groups (name, slug, created_at, updated_at) VALUES ('Fuchibol oculto', 'fuchiboloculto', NOW(), NOW()) RETURNING id;"
      );
      groupId = groupRows[0].id;
    }

    await queryInterface.sequelize.query(
      'UPDATE players SET group_id = :groupId WHERE group_id IS NULL;',
      { replacements: { groupId } }
    );
    await queryInterface.sequelize.query(
      'UPDATE matches SET group_id = :groupId WHERE group_id IS NULL;',
      { replacements: { groupId } }
    );
    await queryInterface.sequelize.query(
      'UPDATE teams SET group_id = :groupId WHERE group_id IS NULL;',
      { replacements: { groupId } }
    );
    await queryInterface.sequelize.query(
      'UPDATE match_results SET group_id = :groupId WHERE group_id IS NULL;',
      { replacements: { groupId } }
    );
    await queryInterface.sequelize.query(
      'UPDATE distinctions SET group_id = :groupId WHERE group_id IS NULL;',
      { replacements: { groupId } }
    );
    await queryInterface.sequelize.query(
      'UPDATE elo_history SET group_id = :groupId WHERE group_id IS NULL;',
      { replacements: { groupId } }
    );
    await queryInterface.sequelize.query(
      'UPDATE app_config SET group_id = :groupId WHERE group_id IS NULL;',
      { replacements: { groupId } }
    );
    await queryInterface.sequelize.query(
      'UPDATE config_history SET group_id = :groupId WHERE group_id IS NULL;',
      { replacements: { groupId } }
    );
    await queryInterface.sequelize.query(
      'UPDATE courts SET group_id = :groupId WHERE group_id IS NULL;',
      { replacements: { groupId } }
    );
    await queryInterface.sequelize.query(
      'UPDATE team_players tp SET group_id = t.group_id FROM teams t WHERE tp.team_id = t.id AND tp.group_id IS NULL;'
    );

    await queryInterface.sequelize.query(
      'UPDATE users u SET gender = p.gender::text::enum_users_gender FROM players p WHERE p.user_id = u.id AND u.gender IS NULL;'
    );

    const [memberRows] = await queryInterface.sequelize.query(
      'SELECT COUNT(*)::int AS count FROM group_members WHERE group_id = :groupId;',
      { replacements: { groupId } }
    );
    if (memberRows[0].count === 0) {
      const [adminRows] = await queryInterface.sequelize.query(
        "SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1;"
      );
      const adminId = adminRows.length ? adminRows[0].id : null;

      if (adminId) {
        await queryInterface.sequelize.query(
          'INSERT INTO group_members (group_id, user_id, role, created_at, updated_at) SELECT :groupId, id, (CASE WHEN id = :adminId THEN \'admin\' ELSE \'member\' END)::enum_group_members_role, NOW(), NOW() FROM users;'
        , { replacements: { groupId, adminId } });
      } else {
        await queryInterface.sequelize.query(
          'INSERT INTO group_members (group_id, user_id, role, created_at, updated_at) SELECT :groupId, id, \'member\'::enum_group_members_role, NOW(), NOW() FROM users;'
        , { replacements: { groupId } });
      }
    }

    for (const table of groupScopedTables) {
      await queryInterface.changeColumn(table, 'group_id', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'groups', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });
    }

    if (!(await indexExists(queryInterface, 'players', 'players_unique_group_nickname_active'))) {
      await queryInterface.addIndex('players', ['group_id', 'name'], {
        unique: true,
        name: 'players_unique_group_nickname_active',
        where: { deleted_at: null },
      });
    }

    if (!(await indexExists(queryInterface, 'group_members', 'group_members_unique_active'))) {
      await queryInterface.addIndex('group_members', ['group_id', 'user_id'], {
        unique: true,
        name: 'group_members_unique_active',
        where: { deleted_at: null },
      });
    }

    if (!(await indexExists(queryInterface, 'app_config', 'app_config_unique_group'))) {
      await queryInterface.addIndex('app_config', ['group_id'], {
        unique: true,
        name: 'app_config_unique_group',
      });
    }
  },

  async down(queryInterface) {
    if (await indexExists(queryInterface, 'app_config', 'app_config_unique_group')) {
      await queryInterface.removeIndex('app_config', 'app_config_unique_group');
    }
    if (await indexExists(queryInterface, 'group_members', 'group_members_unique_active')) {
      await queryInterface.removeIndex('group_members', 'group_members_unique_active');
    }
    if (await indexExists(queryInterface, 'players', 'players_unique_group_nickname_active')) {
      await queryInterface.removeIndex('players', 'players_unique_group_nickname_active');
    }

    if (await columnExists(queryInterface, 'players', 'deleted_at')) {
      await queryInterface.removeColumn('players', 'deleted_at');
    }

    const groupScopedTables = [
      'players',
      'matches',
      'teams',
      'team_players',
      'match_results',
      'distinctions',
      'elo_history',
      'app_config',
      'config_history',
      'courts',
    ];

    for (const table of groupScopedTables) {
      if (await columnExists(queryInterface, table, 'group_id')) {
        await queryInterface.removeColumn(table, 'group_id');
      }
    }

    if (await columnExists(queryInterface, 'users', 'gender')) {
      await queryInterface.removeColumn('users', 'gender');
    }

    if (await tableExists(queryInterface, 'group_invites')) {
      await queryInterface.dropTable('group_invites');
    }
    if (await tableExists(queryInterface, 'group_members')) {
      await queryInterface.dropTable('group_members');
    }
    if (await tableExists(queryInterface, 'groups')) {
      await queryInterface.dropTable('groups');
    }

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_group_members_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_group_invites_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_gender";');
  },
};
