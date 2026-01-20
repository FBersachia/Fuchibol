const jwt = require('jsonwebtoken');
const { authenticate, requireRole } = require('../src/middleware/auth');

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
