process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.DB_SYNC = 'true';
process.env.JWT_SECRET = 'test_secret';

const bcrypt = require('bcryptjs');
const { sequelize, User, Group, GroupMember } = require('../src/models');

beforeEach(async () => {
  await sequelize.sync({ force: true });

  const password_hash = await bcrypt.hash('adminpass', 10);
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@local.com',
    password_hash,
    role: 'admin',
  });

  const group = await Group.create({
    name: 'Fuchibol oculto',
    slug: 'fuchiboloculto',
  });

  await GroupMember.create({
    group_id: group.id,
    user_id: admin.id,
    role: 'admin',
  });

  process.env.TEST_GROUP_ID = String(group.id);
});

afterAll(async () => {
  await sequelize.close();
});
