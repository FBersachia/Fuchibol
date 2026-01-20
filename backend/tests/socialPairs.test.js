const request = require('supertest');
const { app } = require('../src/app');
const { getAdminToken } = require('./helpers');

async function authHeader() {
  const token = await getAdminToken();
  return { Authorization: `Bearer ${token}` };
}

describe('Social pairs', () => {
  it('returns social pairs', async () => {
    const res = await request(app)
      .get('/social-pairs?since_months=12')
      .set(await authHeader());

    expect(res.status).toBe(200);
    expect(res.body.pairs).toBeDefined();
  });
});
