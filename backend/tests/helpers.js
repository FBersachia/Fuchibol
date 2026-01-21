const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Group } = require('../src/models');

async function getAdminToken() {
  const admin = await User.findOne({ where: { email: 'admin@local.com' } });
  const payload = { id: admin.id, role: admin.role, name: admin.name };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

function signTokenForUser(user) {
  const payload = { id: user.id, role: user.role, name: user.name };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function getDefaultGroupId() {
  if (process.env.TEST_GROUP_ID) {
    return Number(process.env.TEST_GROUP_ID);
  }

  const group = await Group.findOne({ where: { slug: 'fuchiboloculto' } });
  if (!group) {
    throw new Error('Default group not found');
  }
  process.env.TEST_GROUP_ID = String(group.id);
  return group.id;
}

async function buildAuthHeaders(token, groupId) {
  const headers = { Authorization: `Bearer ${token}` };
  if (groupId) {
    headers['X-Group-Id'] = String(groupId);
  }
  return headers;
}

async function getAdminAuthHeaders(groupId) {
  const token = await getAdminToken();
  const resolvedGroupId = groupId || (await getDefaultGroupId());
  return buildAuthHeaders(token, resolvedGroupId);
}

async function createTestUser({
  name = 'User',
  email = 'user@local.com',
  role = 'user',
  gender = null,
  password = 'pass',
} = {}) {
  const password_hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, role, gender, password_hash });
  return { user, password };
}

async function getAuthHeadersForUser(user, groupId) {
  const token = signTokenForUser(user);
  return buildAuthHeaders(token, groupId);
}

module.exports = {
  getAdminToken,
  getDefaultGroupId,
  getAdminAuthHeaders,
  signTokenForUser,
  createTestUser,
  getAuthHeadersForUser,
  buildAuthHeaders,
};

