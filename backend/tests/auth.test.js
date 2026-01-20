const request = require('supertest');
const { app } = require('../src/app');

describe('Auth', () => {
  it('logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@local.com', password: 'adminpass' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'admin@local.com', password: 'bad' });

    expect(res.status).toBe(401);
  });

  it('logout returns ok', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
