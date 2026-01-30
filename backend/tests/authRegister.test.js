const request = require('supertest');
const { app } = require('../src/app');
const { User } = require('../src/models');

describe('Auth register', () => {
  it('registers a new user and returns token', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'new@local.com', password: 'password1' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ role: 'user' });

    const created = await User.findOne({ where: { email: 'new@local.com' } });
    expect(created).toBeTruthy();
  });

  it('rejects short passwords', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'short@local.com', password: 'short' });

    expect(res.status).toBe(400);
  });

  it('rejects duplicate emails', async () => {
    await request(app)
      .post('/auth/register')
      .send({ email: 'dup@local.com', password: 'password1' });

    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'dup@local.com', password: 'password1' });

    expect(res.status).toBe(409);
  });
});
