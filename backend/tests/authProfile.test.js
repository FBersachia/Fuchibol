const request = require('supertest');
const { app } = require('../src/app');
const { getAdminAuthHeaders } = require('./helpers');

async function authHeader() {
  return getAdminAuthHeaders();
}

describe('Auth profile', () => {
  it('returns current user', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set(await authHeader());

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('admin@local.com');
  });

  it('changes password', async () => {
    const res = await request(app)
      .post('/auth/change-password')
      .set(await authHeader())
      .send({ current_password: 'adminpass', new_password: 'newpass' });

    expect(res.status).toBe(200);

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@local.com', password: 'newpass' });

    expect(loginRes.status).toBe(200);
  });
});

