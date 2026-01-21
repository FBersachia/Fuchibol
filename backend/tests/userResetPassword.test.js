const request = require('supertest');
const { app } = require('../src/app');
const { getAdminAuthHeaders } = require('./helpers');

async function authHeader() {
  return getAdminAuthHeaders();
}

describe('User reset password', () => {
  it('resets password for a user', async () => {
    const createRes = await request(app)
      .post('/users')
      .set(await authHeader())
      .send({ name: 'User', email: 'user@local.com', password: 'pass', role: 'user' });

    const userId = createRes.body.id;

    const resetRes = await request(app)
      .post(`/users/${userId}/reset-password`)
      .set(await authHeader())
      .send({ new_password: 'newpass' });

    expect(resetRes.status).toBe(200);

    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email: 'user@local.com', password: 'newpass' });

    expect(loginRes.status).toBe(200);
  });
});

