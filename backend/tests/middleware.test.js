const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticate, requireRole } = require('../src/middleware/auth');
const { requireGroup, requireGroupRole } = require('../src/middleware/groupContext');
const { User } = require('../src/models');
const { getDefaultGroupId } = require('./helpers');

function mockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('auth middleware', () => {
  it('authenticates valid token', () => {
    const token = jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('blocks invalid token', () => {
    const req = { headers: { authorization: 'Bearer bad' } };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);
    expect(res.statusCode).toBe(401);
  });

  it('enforces role', () => {
    const req = { user: { role: 'user' } };
    const res = mockRes();
    const next = jest.fn();

    requireRole('admin')(req, res, next);
    expect(res.statusCode).toBe(403);
  });
});

describe('groupContext middleware', () => {
  it('requires X-Group-Id header', async () => {
    const req = { headers: {}, user: { id: 1 } };
    const res = mockRes();
    const next = jest.fn();

    await requireGroup(req, res, next);
    expect(res.statusCode).toBe(400);
  });

  it('rejects invalid X-Group-Id header', async () => {
    const req = { headers: { 'x-group-id': 'abc' }, user: { id: 1 } };
    const res = mockRes();
    const next = jest.fn();

    await requireGroup(req, res, next);
    expect(res.statusCode).toBe(400);
  });

  it('returns 404 when group does not exist', async () => {
    const admin = await User.findOne({ where: { email: 'admin@local.com' } });
    const req = { headers: { 'x-group-id': '9999' }, user: { id: admin.id } };
    const res = mockRes();
    const next = jest.fn();

    await requireGroup(req, res, next);
    expect(res.statusCode).toBe(404);
  });

  it('blocks users that are not members', async () => {
    const groupId = await getDefaultGroupId();
    const password_hash = await bcrypt.hash('pass', 10);
    const outsider = await User.create({
      name: 'Outsider',
      email: 'outsider@local.com',
      password_hash,
      role: 'user',
    });

    const req = { headers: { 'x-group-id': String(groupId) }, user: { id: outsider.id } };
    const res = mockRes();
    const next = jest.fn();

    await requireGroup(req, res, next);
    expect(res.statusCode).toBe(403);
  });

  it('allows members and sets group context', async () => {
    const groupId = await getDefaultGroupId();
    const admin = await User.findOne({ where: { email: 'admin@local.com' } });
    const req = { headers: { 'x-group-id': String(groupId) }, user: { id: admin.id } };
    const res = mockRes();
    const next = jest.fn();

    await requireGroup(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.group.id).toBe(groupId);
  });

  it('enforces group role', () => {
    const req = { groupMember: { role: 'member' } };
    const res = mockRes();
    const next = jest.fn();

    requireGroupRole('admin')(req, res, next);
    expect(res.statusCode).toBe(403);
  });

  it('allows matching group role', () => {
    const req = { groupMember: { role: 'admin' } };
    const res = mockRes();
    const next = jest.fn();

    requireGroupRole('admin')(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
