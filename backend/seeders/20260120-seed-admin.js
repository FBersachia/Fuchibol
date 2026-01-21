'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const [rows] = await queryInterface.sequelize.query(
      "SELECT COUNT(*)::int AS count FROM users WHERE email = 'admin@local.com';"
    );

    if (rows[0].count > 0) return;

    const password_hash = await bcrypt.hash('adminpass', 10);

    await queryInterface.bulkInsert('users', [
      {
        name: 'Admin',
        email: 'admin@local.com',
        password_hash,
        role: 'admin',
        gender: 'h',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    const [groupRows] = await queryInterface.sequelize.query(
      "SELECT id FROM groups WHERE slug = 'fuchiboloculto';"
    );
    if (groupRows.length > 0) {
      const [userRows] = await queryInterface.sequelize.query(
        "SELECT id FROM users WHERE email = 'admin@local.com';"
      );
      if (userRows.length > 0) {
        await queryInterface.bulkInsert('group_members', [
          {
            group_id: groupRows[0].id,
            user_id: userRows[0].id,
            role: 'admin',
            created_at: new Date(),
            updated_at: new Date(),
          },
        ]);
      }
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@local.com' });
  },
};
