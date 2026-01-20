const request = require('supertest');
const { app } = require('../src/app');
const { getAdminToken } = require('./helpers');

async function authHeader() {
  const token = await getAdminToken();
  return { Authorization: `Bearer ${token}` };
}

describe('Config history', () => {
  it('records config changes', async () => {
    await request(app)
      .put('/config')
      .set(await authHeader())
      .send({ w_elo: 1.3 });

    const res = await request(app)
      .get('/config/history?limit=10')
      .set(await authHeader());

    expect(res.status).toBe(200);
    expect(res.body.history.length).toBeGreaterThan(0);
  });
});
