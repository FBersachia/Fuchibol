const jwt = require('jsonwebtoken');
const { User } = require('../src/models');

async function getAdminToken() {
  const admin = await User.findOne({ where: { email: 'admin@local.com' } });
  const payload = { id: admin.id, role: admin.role, name: admin.name };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

module.exports = { getAdminToken };
