process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.DB_SYNC = 'true';
process.env.JWT_SECRET = 'test_secret';

const bcrypt = require('bcryptjs');
const { sequelize, User } = require('../src/models');

beforeEach(async () => {
  await sequelize.sync({ force: true });

  const password_hash = await bcrypt.hash('adminpass', 10);
  await User.create({
    name: 'Admin',
    email: 'admin@local.com',
    password_hash,
    role: 'admin',
  });
});

afterAll(async () => {
  await sequelize.close();
});
