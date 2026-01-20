const request = require('supertest');
const { app } = require('../src/app');
const { getAdminToken } = require('./helpers');

async function authHeader() {
  const token = await getAdminToken();
  return { Authorization: `Bearer ${token}` };
}

describe('Users', () => {
  it('lists users', async () => {
    const res = await request(app).get('/users').set(await authHeader());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('creates, updates, deletes a user', async () => {
    const createRes = await request(app)
      .post('/users')
      .set(await authHeader())
      .send({ name: 'Test', email: 'test@local.com', password: 'pass', role: 'user' });

    expect(createRes.status).toBe(201);

    const userId = createRes.body.id;

    const updateRes = await request(app)
      .patch(`/users/${userId}`)
      .set(await authHeader())
      .send({ name: 'Test2' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.name).toBe('Test2');

    const deleteRes = await request(app)
      .delete(`/users/${userId}`)
      .set(await authHeader());

    expect(deleteRes.status).toBe(204);
  });
});
