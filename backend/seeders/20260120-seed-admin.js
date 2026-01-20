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
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@local.com' });
  },
};
